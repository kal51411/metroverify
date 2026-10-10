import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.v3_telemetry_service import telemetry_manager

router = APIRouter(prefix="/api/v3/telemetry", tags=["v3-telemetry"])

@router.websocket("/ws/{instrument_id}")
async def telemetry_websocket(websocket: WebSocket, instrument_id: str):
    await telemetry_manager.connect(websocket, instrument_id)
    # Start background telemetry broadcast task for this instrument if not already streaming
    asyncio.create_task(telemetry_manager.broadcast_telemetry(instrument_id))
    try:
        while True:
            # Keep connection alive and listen for any client commands (e.g. TARE, CALIBRATE)
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")
    except WebSocketDisconnect:
    
        telemetry_manager.disconnect(websocket, instrument_id)
