import pytest
import uuid
from app.models.instruments import Instrument, AccuracyClassEnum, InstrumentStatusEnum
from app.models.applications import Application, ApplicationStatusEnum, ApplicationTypeEnum, JurisdictionStatusEnum
from app.models.standards import StandardAsset, StandardHierarchyEnum, AssetStatusEnum
from app.models.certificates import VerificationCertificate
from app.schemas.inspections import (
    CompleteInspectionInput, VisualInspectionInput, ZeroTestInput,
    IndicationTestMeasurementInput, RepeatabilityTestInput,
    EccentricityMeasurementInput, DiscriminationTestInput, TareTestInput,
    ZeroReturnTestInput, SealRecordInput
)
from app.services.inspection_service import InspectionService
from app.services.certificate_service import CertificateService
from datetime import datetime, timedelta

def test_full_inspection_lifecycle_and_blocking(db_session):
    db = db_session
    unique_id = uuid.uuid4().hex[:6]
    
    # 1. Create a Synthetic Class III Scale (Max: 150 kg, Min: 1 kg, e: 0.05 kg, d: 0.01 kg)
    inst = Instrument(
        instrument_id=f"TEST-INST-{unique_id}",
        instrument_type="NON_AUTOMATIC_WEIGHING_INSTRUMENT",
        manufacturer="DemoScale Systems",
        model="DS-150P",
        serial_number=f"TEST-SN-{unique_id}",
        accuracy_class=AccuracyClassEnum.CLASS_III,
        max_capacity=150.0,
        min_capacity=1.0,
        verification_scale_interval_e=0.05,
        actual_scale_interval_d=0.01,
        unit="kg",
        owner_name="Test Trader",
        business_name="Test Agro",
        address="APMC Pune",
        district="Pune",
        division="Pune",
        status=InstrumentStatusEnum.PENDING_VERIFICATION
    )
    db.add(inst)
    db.flush()

    app = Application(
        application_id=f"TEST-APP-{unique_id}",
        instrument_id=inst.id,
        applicant_id=1,
        application_type=ApplicationTypeEnum.NEW_VERIFICATION,
        status=ApplicationStatusEnum.SCHEDULED,
        jurisdiction_status=JurisdictionStatusEnum.VALID_JURISDICTION,
        assigned_inspector_id=2
    )
    db.add(app)
    db.commit()

    # Build valid test inputs (Class III, e=0.05 kg):
    # 10 kg -> 200e -> MPE +/-0.025 kg -> observed 10.010 kg (error +0.010 kg, PASS)
    # 50 kg -> 1000e -> MPE +/-0.050 kg -> observed 50.041 kg (error +0.041 kg, PASS)
    # 150 kg -> 3000e -> MPE +/-0.075 kg -> observed 150.050 kg (error +0.050 kg, PASS)
    valid_input = CompleteInspectionInput(
        visual_inspection=VisualInspectionInput(),
        zero_test=ZeroTestInput(zero_before=0.0, zero_after=0.005),
        indication_tests=[
            IndicationTestMeasurementInput(load_target=10.0, standard_value=10.0, observed_value=10.010),
            IndicationTestMeasurementInput(load_target=50.0, standard_value=50.0, observed_value=50.041),
            IndicationTestMeasurementInput(load_target=150.0, standard_value=150.0, observed_value=150.050),
        ],
        repeatability_test=RepeatabilityTestInput(
            test_load=50.0,
            readings=[50.040, 50.042, 50.041] # Range = 0.002 kg <= MPE 0.050 kg
        ),
        eccentricity_test=[
            EccentricityMeasurementInput(position="CENTER", standard_value=50.0, observed_value=50.040),
            EccentricityMeasurementInput(position="TOP_LEFT", standard_value=50.0, observed_value=50.045),
            EccentricityMeasurementInput(position="TOP_RIGHT", standard_value=50.0, observed_value=50.038),
            EccentricityMeasurementInput(position="BOTTOM_LEFT", standard_value=50.0, observed_value=50.042),
            EccentricityMeasurementInput(position="BOTTOM_RIGHT", standard_value=50.0, observed_value=50.044),
        ],
        discrimination_test=DiscriminationTestInput(
            test_load=50.0,
            base_indication=50.00,
            extra_load_applied=0.014, # 1.4d
            new_indication=50.01,
            indication_incremented=True
        ),
        tare_test=TareTestInput(
            gross_load=50.0,
            tare_load=10.0,
            observed_net=40.01
        ),
        zero_return_test=ZeroReturnTestInput(
            zero_after_unloading=0.005
        ),
        seal_record=SealRecordInput(
            seal_number=f"MH-LM-SEAL-{unique_id}"
        )
    )

    # 2. Execute Inspection -> Expected PASS
    res = InspectionService.execute_and_complete_inspection(db, app.id, valid_input, inspector_id=2)
    assert res["final_result"] == "PASS"
    assert res["is_pass"] is True
    assert app.status == ApplicationStatusEnum.INSPECTION_PASSED

    # 3. Generate Certificate -> Expected Success
    cert = CertificateService.generate_certificate_for_application(db, app.id, officer_user_id=2)
    assert cert.result == "PASS"
    assert cert.certificate_number.startswith("LM-CERT-")
    assert len(cert.certificate_hash) == 64
    assert cert.interval_months == 12 # Commercial scale

    # 4. Test Public QR Verification
    public_verify = CertificateService.verify_public_certificate(db, cert.certificate_number)
    assert public_verify["is_valid"] is True
    assert public_verify["status"] == "VALID"
    assert public_verify["hash_verified"] is True
    assert public_verify["serial_number"] == f"TEST-SN-{unique_id}"

    # 5. TEST BLOCKING: Now make one measurement FAIL
    # Change 50 kg observed to 50.065 kg (Error: +0.065 kg > MPE 0.050 kg)
    failing_input = valid_input.model_copy(deep=True)
    failing_input.indication_tests[1] = IndicationTestMeasurementInput(
        load_target=50.0, standard_value=50.0, observed_value=50.065
    )

    fail_res = InspectionService.execute_and_complete_inspection(db, app.id, failing_input, inspector_id=2)
    assert fail_res["final_result"] == "FAIL"
    assert fail_res["is_pass"] is False
    assert len(fail_res["failed_reasons"]) > 0
    assert "exceeds MPE" in fail_res["failed_reasons"][0]

    # 6. Test Correcting Measurement
    # Inspector fixes typo from 50.065 to 50.040 kg
    first_meas = app.inspection.measurements[1]
    from app.routers.inspections import correct_measurement
    corr_res = correct_measurement(
        measurement_id=first_meas.id,
        corrected_observed_value=50.040,
        reason="Corrected transcription typo from physical log sheet",
        db=db
    )
    assert corr_res["measurement"].within_mpe is True
    assert corr_res["measurement"].observed_value == 50.040
