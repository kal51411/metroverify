import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.applications import Application, ApplicationStatusEnum
from app.models.instruments import Instrument, InstrumentStatusEnum
from app.models.inspections import (
    Inspection, InspectionTestStep, TestMeasurement, SealRecord,
    InspectionEvidence, TestTemplate
)
from app.models.standards import StandardAsset, AssetStatusEnum
from app.schemas.inspections import CompleteInspectionInput
from app.rules.base import DEFAULT_RULESET_VERSION
from app.rules.mpe_calculator import calculate_mpe, evaluate_indication_error
from app.rules.high_capacity import evaluate_high_capacity_substitution
from app.rules.test_templates import get_default_template_steps
from app.services.audit_service import AuditService

class InspectionService:
    @classmethod
    def start_inspection(
        cls,
        db: Session,
        application_id: int,
        inspector_id: int
    ) -> Inspection:
        app = db.query(Application).options(
            joinedload(Application.instrument)
        ).filter(Application.id == application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found.")
            
        if app.status not in (ApplicationStatusEnum.SCHEDULED, ApplicationStatusEnum.UNDER_REVIEW, ApplicationStatusEnum.APPROVED, ApplicationStatusEnum.UNDER_INSPECTION):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start inspection for application in status {app.status.value}."
            )
            
        inst = app.instrument
        existing_insp = db.query(Inspection).filter(Inspection.application_id == application_id).first()
        if existing_insp and existing_insp.status == "IN_PROGRESS":
            return existing_insp
            
        insp_id = f"LM-INS-{datetime.utcnow().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}"
        
        # Load or create test template
        template_steps = get_default_template_steps(inst.instrument_type)
        
        inspection = Inspection(
            inspection_id=insp_id,
            application_id=app.id,
            instrument_id=inst.id,
            inspector_id=inspector_id,
            ruleset_version=DEFAULT_RULESET_VERSION,
            status="IN_PROGRESS",
            test_location=app.test_centre_or_premises or "Premises of User",
            started_at=datetime.utcnow()
        )
        db.add(inspection)
        db.flush()
        
        for s in template_steps:
            step = InspectionTestStep(
                inspection_id=inspection.id,
                step_key=s["step_key"],
                step_name=s["step_name"],
                step_order=s["step_order"],
                status="PENDING",
                notes=s.get("description")
            )
            db.add(step)
            
        app.status = ApplicationStatusEnum.UNDER_INSPECTION
        db.flush()
        
        AuditService.log_event(
            db=db,
            action="INSPECTION_STARTED",
            entity_type="Inspection",
            entity_id=insp_id,
            user_id=str(inspector_id),
            user_role="INSPECTOR",
            new_value={"status": "IN_PROGRESS", "application_id": app.application_id}
        )
        
        db.commit()
        db.refresh(inspection)
        return inspection

    @classmethod
    def execute_and_complete_inspection(
        cls,
        db: Session,
        application_id: int,
        input_data: CompleteInspectionInput,
        inspector_id: int
    ) -> Dict[str, Any]:
        app = db.query(Application).options(
            joinedload(Application.instrument),
            joinedload(Application.inspection)
        ).filter(Application.id == application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found.")
            
        inst = app.instrument
        e = inst.verification_scale_interval_e
        accuracy_class = inst.accuracy_class
        unit = inst.unit
        
        inspection = app.inspection
        if not inspection:
            inspection = cls.start_inspection(db, application_id, inspector_id)
            
        failed_reasons = []
        detailed_summary_lines = []
        
        # 1. Validate Standard Assets
        if input_data.standard_asset_ids:
            for asset_id in input_data.standard_asset_ids:
                asset = db.query(StandardAsset).filter(StandardAsset.standard_asset_id == asset_id).first()
                if not asset:
                    failed_reasons.append(f"Standard asset {asset_id} does not exist in the verification database.")
                elif asset.status != AssetStatusEnum.ACTIVE:
                    failed_reasons.append(f"Standard asset {asset_id} is {asset.status.value} (not ACTIVE).")
                elif asset.valid_until < datetime.utcnow():
                    failed_reasons.append(f"Standard asset {asset_id} calibration certificate expired on {asset.valid_until.strftime("%Y-%m-%d")}.")
                    
        # 2. Visual Inspection
        vis = input_data.visual_inspection
        vis_pass = (
            vis.nameplate_intact and vis.markings_legible and
            vis.serial_matches_application and vis.level_indicator_centered and
            vis.sealing_provision_intact and vis.physical_condition_acceptable
        )
        inspection.visual_inspection_status = "PASS" if vis_pass else "FAIL"
        if not vis_pass:
            failed_reasons.append("Visual & metrological identification checks failed (marking, sealing, or physical defect).")
            
        # 3. Zero Test
        zt = input_data.zero_test
        zero_dev = abs(zt.zero_after - zt.zero_before)
        max_zero_dev = 0.25 * e
        zero_pass = (zero_dev <= max_zero_dev + 1e-9) and zt.stable_zero_indicator
        inspection.zero_test_status = "PASS" if zero_pass else "FAIL"
        if not zero_pass:
            failed_reasons.append(f"Zero stability failed: deviation {zero_dev} {unit} exceeds permissible 0.25e ({max_zero_dev} {unit}).")
            
        # 4. Indication Error Tests (MPE)
        # Clear previous measurements if re-running
        db.query(TestMeasurement).filter(TestMeasurement.inspection_id == inspection.id).delete()
        
        max_observed_error = 0.0
        max_error_mpe_limit = 0.0
        indication_pass = True
        
        for m_in in input_data.indication_tests:
            eval_res = evaluate_indication_error(
                load_target=m_in.load_target,
                standard_value=m_in.standard_value,
                observed_value=m_in.observed_value,
                e=e,
                accuracy_class=accuracy_class
            )
            if not eval_res["within_mpe"]:
                indication_pass = False
                failed_reasons.append(
                    f"Indication error at load {m_in.load_target} {unit}: observed error {eval_res["error"]} {unit} "
                    f"exceeds MPE of +/-{eval_res["mpe"]} {unit} (Diff: +{eval_res["difference_from_limit"]} {unit})."
                )
                
            if abs(eval_res["error"]) > abs(max_observed_error):
                max_observed_error = eval_res["error"]
                max_error_mpe_limit = eval_res["mpe"]
                
            meas = TestMeasurement(
                inspection_id=inspection.id,
                step_key="indication_error",
                load_target=eval_res["load_target"],
                standard_value=eval_res["standard_value"],
                observed_value=eval_res["observed_value"],
                error=eval_res["error"],
                error_percentage=eval_res["error_percentage"],
                verification_interval_count=eval_res["verification_interval_count"],
                mpe=eval_res["mpe"],
                within_mpe=eval_res["within_mpe"],
                run_index=1,
                is_accepted=True,
                timestamp=datetime.utcnow()
            )
            db.add(meas)
            
        inspection.indication_test_status = "PASS" if indication_pass else "FAIL"
        
        # 5. Repeatability Test
        rep = input_data.repeatability_test
        rep_max = max(rep.readings)
        rep_min = min(rep.readings)
        rep_error = round(rep_max - rep_min, 6)
        rep_mpe_info = calculate_mpe(rep.test_load, e, accuracy_class)
        rep_mpe = rep_mpe_info["mpe_value"]
        rep_pass = (rep_error <= rep_mpe + 1e-9)
        inspection.repeatability_test_status = "PASS" if rep_pass else "FAIL"
        if not rep_pass:
            failed_reasons.append(f"Repeatability error ({rep_error} {unit}) exceeded permissible MPE ({rep_mpe} {unit}) at load {rep.test_load} {unit}.")
            
        # 6. Eccentric Loading Test
        ecc_pass = True
        for ecc in input_data.eccentricity_test:
            ecc_eval = evaluate_indication_error(
                load_target=ecc.standard_value,
                standard_value=ecc.standard_value,
                observed_value=ecc.observed_value,
                e=e,
                accuracy_class=accuracy_class
            )
            if not ecc_eval["within_mpe"]:
                ecc_pass = False
                failed_reasons.append(
                    f"Eccentric loading at position {ecc.position}: observed error {ecc_eval["error"]} {unit} "
                    f"exceeds MPE of +/-{ecc_eval["mpe"]} {unit}."
                )
            meas = TestMeasurement(
                inspection_id=inspection.id,
                step_key="eccentricity",
                load_target=ecc.standard_value,
                standard_value=ecc.standard_value,
                observed_value=ecc.observed_value,
                error=ecc_eval["error"],
                error_percentage=ecc_eval["error_percentage"],
                verification_interval_count=ecc_eval["verification_interval_count"],
                mpe=ecc_eval["mpe"],
                within_mpe=ecc_eval["within_mpe"],
                position=ecc.position,
                run_index=1,
                is_accepted=True,
                timestamp=datetime.utcnow()
            )
            db.add(meas)
            
        inspection.eccentricity_test_status = "PASS" if ecc_pass else "FAIL"
        
        # 7. Discrimination Test
        disc = input_data.discrimination_test
        disc_pass = disc.indication_incremented
        inspection.discrimination_test_status = "PASS" if disc_pass else "FAIL"
        if not disc_pass:
            failed_reasons.append(f"Discrimination test failed: addition of 1.4d ({disc.extra_load_applied} {unit}) did not trigger indication increment.")
            
        # 8. Tare Test (if provided)
        if input_data.tare_test:
            tt = input_data.tare_test
            expected_net = round(tt.gross_load - tt.tare_load, 6)
            net_error = round(abs(tt.observed_net - expected_net), 6)
            tare_mpe_info = calculate_mpe(expected_net, e, accuracy_class)
            tare_pass = (net_error <= tare_mpe_info["mpe_value"] + 1e-9) and tt.tare_visibility_verified
            inspection.tare_test_status = "PASS" if tare_pass else "FAIL"
            if not tare_pass:
                failed_reasons.append(f"Tare/Net indication error ({net_error} {unit}) exceeded permissible MPE ({tare_mpe_info[mpe_value]} {unit}).")
        else:
            inspection.tare_test_status = "NOT_APPLICABLE"
            
        # 9. Zero Return Test
        zr = input_data.zero_return_test
        zr_dev = abs(zr.zero_after_unloading)
        max_zr_dev = 0.5 * e
        zr_pass = (zr_dev <= max_zr_dev + 1e-9) and zr.zero_return_stable
        inspection.zero_return_status = "PASS" if zr_pass else "FAIL"
        if not zr_pass:
            failed_reasons.append(f"Zero return failed: residual indication {zr.zero_after_unloading} {unit} exceeds permissible 0.5e ({max_zr_dev} {unit}).")
            
        # 10. High-Capacity Substitution Test (if provided)
        if input_data.high_capacity_substitution:
            hc = input_data.high_capacity_substitution
            hc_eval = evaluate_high_capacity_substitution(
                max_capacity=inst.max_capacity,
                e=e,
                repeatability_readings=hc.repeatability_readings,
                unit=unit
            )
            inspection.high_capacity_substitution_status = hc_eval["eligibility"]
            if hc.actual_standard_weights_available < hc_eval["required_standard_load"]:
                failed_reasons.append(
                    f"High capacity substitution requirement not satisfied: Available standard weights "
                    f"({hc.actual_standard_weights_available} {unit}) less than required {hc_eval[fraction_label]} ({hc_eval[required_standard_load]} {unit})."
                )
        else:
            inspection.high_capacity_substitution_status = "NOT_APPLICABLE"
            
        # 11. Seal Record
        sr = input_data.seal_record
        db.query(SealRecord).filter(SealRecord.inspection_id == inspection.id).delete()
        seal = SealRecord(
            inspection_id=inspection.id,
            instrument_id=inst.id,
            seal_number=sr.seal_number,
            seal_type=sr.seal_type,
            seal_location=sr.seal_location,
            verification_mark_location=sr.verification_mark_location,
            applied_by=str(inspector_id),
            condition=sr.condition,
            tamper_status="SECURE",
            applied_at=datetime.utcnow()
        )
        db.add(seal)
        
        # 12. Final Decision Calculation
        is_overall_pass = len(failed_reasons) == 0
        final_result = "PASS" if is_overall_pass else "FAIL"
        inspection.final_result = final_result
        inspection.status = "PASSED" if is_overall_pass else "FAILED"
        inspection.completed_at = datetime.utcnow()
        
        # Build Deterministic Auditable Explanation
        if is_overall_pass:
            decision_summary = (
                f"PASS — All mandatory verification tests successfully satisfied under {DEFAULT_RULESET_VERSION}.\n"
                f"• Maximum Observed Indication Error: {max_observed_error:+.4f} {unit} (Legal MPE: +/-{max_error_mpe_limit:.4f} {unit})\n"
                f"• Repeatability Range: {rep_error:.4f} {unit} (MPE Limit: {rep_mpe:.4f} {unit})\n"
                f"• Eccentric Loading: COMPLIANT across all test positions\n"
                f"• Discrimination & Zero Return: PASS\n"
                f"• Physical Sealing Applied: Seal #{sr.seal_number} ({sr.seal_location})"
            )
        else:
            decision_summary = (
                f"FAIL — Instrument failed metrological verification criteria under {DEFAULT_RULESET_VERSION}.\n"
                f"Specific Deficiencies:\n" + "\n".join(f"• {r}" for r in failed_reasons)
            )
            
        inspection.decision_summary = decision_summary
        
        # Update Application Status
        if is_overall_pass:
            app.status = ApplicationStatusEnum.INSPECTION_PASSED
        else:
            app.status = ApplicationStatusEnum.INSPECTION_FAILED
            inst.status = InstrumentStatusEnum.REJECTED
            
        AuditService.log_event(
            db=db,
            action=f"INSPECTION_{final_result}",
            entity_type="Inspection",
            entity_id=inspection.inspection_id,
            user_id=str(inspector_id),
            user_role="INSPECTOR",
            new_value={
                "result": final_result,
                "failed_reasons": failed_reasons,
                "max_observed_error": max_observed_error
            },
            reason=decision_summary
        )
        
        db.commit()
        db.refresh(inspection)
        
        return {
            "inspection_id": inspection.id,
            "inspection_ref": inspection.inspection_id,
            "final_result": final_result,
            "is_pass": is_overall_pass,
            "decision_summary": decision_summary,
            "failed_reasons": failed_reasons,
            "application_status": app.status.value,
            "max_observed_error": max_observed_error,
            "max_error_mpe_limit": max_error_mpe_limit
        }
