import asyncio
import random
from datetime import datetime, timezone
from typing import Dict, List, Set
from fastapi import WebSocket

class V3TelemetryManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, instrument_id: str):
        await websocket.accept()
        if instrument_id not in self.active_connections:
            self.active_connections[instrument_id] = set()
        self.active_connections[instrument_id].add(websocket)

    def disconnect(self, websocket: WebSocket, instrument_id: str):
        if instrument_id in self.active_connections:
            self.active_connections[instrument_id].discard(websocket)
            if not self.active_connections[instrument_id]:
                del self.active_connections[instrument_id]

    async def broadcast_telemetry(self, instrument_id: str, base_capacity: float = 50000.0):
        while instrument_id in self.active_connections and self.active_connections[instrument_id]:
            # Simulate 4 corner load cells with minor jitter and random drift
            noise = random.uniform(-2.5, 2.5)
            c1 = (base_capacity / 4.0) + noise + random.uniform(-1.0, 1.0)
            c2 = (base_capacity / 4.0) + noise + random.uniform(-1.0, 1.0)
            c3 = (base_capacity / 4.0) + noise + random.uniform(-1.0, 1.0)
            c4 = (base_capacity / 4.0) + noise + random.uniform(-1.0, 1.0)
            gross = c1 + c2 + c3 + c4
            
            zero_drift = round(random.uniform(0.0, 0.05), 3)
            corner_imbalance = round(abs(max(c1, c2, c3, c4) - min(c1, c2, c3, c4)), 2)
            
            status = "NORMAL"
            if corner_imbalance > 15.0 or zero_drift > 0.04:
                status = "WARNING"

            packet = {
                "instrument_id": instrument_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "cells": [round(c1, 2), round(c2, 2), round(c3, 2), round(c4, 2)],
                "gross_weight": round(gross, 2),
                "unit": "kg",
                "zero_drift": zero_drift,
                "corner_imbalance": corner_imbalance,
                "mpe_limit": 15.0,
                "status": status
            }

            disconnected = set()
            for connection in self.active_connections.get(instrument_id, set()):
                try:
                    await connection.send_json(packet)
                except Exception:
                    disconnected.add(connection)
            
            for conn in disconnected:
                self.disconnect(conn, instrument_id)

            await asyncio.sleep(0.5)

telemetry_manager = V3TelemetryManager()
