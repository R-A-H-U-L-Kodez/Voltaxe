"""
Strike Module - Automated Response Orchestrator
This module handles automated security response actions by communicating with Voltaxe Sentinels.
This is the "A" in CRaaS (Cyber Resilience-as-a-Service).

Updated with command queueing for reliable two-way communication.
"""

import httpx
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import logging
from database import SessionLocal

logger = logging.getLogger(__name__)

class StrikeOrchestrator:
    """
    Orchestrates automated response actions across the Voltaxe platform.
    Communicates with Sentinels via:
    1. Direct HTTP (for immediate response if agent is online)
    2. Command Queue (for reliable delivery via agent polling)
    """
    
    def __init__(self):
        # In production, these would be loaded from environment variables or config
        self.sentinel_registry: Dict[str, str] = {}
        self.action_timeout = 30.0  # seconds
        
    def register_sentinel(self, hostname: str, sentinel_url: str):
        """Register a Sentinel endpoint for a given hostname"""
        self.sentinel_registry[hostname] = sentinel_url
        logger.info(f"[STRIKE] Registered Sentinel for '{hostname}' at {sentinel_url}")
    
    def _queue_command(self, hostname: str, command: str, params: Dict[str, Any], initiated_by: str, priority: int = 0):
        """
        Queue a command in the database for agent polling.
        This ensures command delivery even if direct HTTP fails.
        
        Args:
            hostname: Target endpoint hostname
            command: Command to execute (network_isolate, network_restore, etc.)
            params: Command parameters
            initiated_by: User who initiated the command
            priority: Command priority (higher = more urgent)
        """
        from main import PendingCommandDB
        
        db = SessionLocal()
        try:
            pending_cmd = PendingCommandDB(
                hostname=hostname,
                command=command,
                params=params,
                status="pending",
                created_by=initiated_by,
                priority=priority
            )
            db.add(pending_cmd)
            db.commit()
            db.refresh(pending_cmd)
            
            logger.info(f"[STRIKE QUEUE] ✓ Queued command '{command}' (ID: {pending_cmd.id}) for '{hostname}'")
            return pending_cmd.id
        except Exception as e:
            logger.error(f"[STRIKE QUEUE] ❌ Failed to queue command: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    async def isolate_endpoint(
        self,
        hostname: str,
        initiated_by: str,
        reason: str = "Security threat detected"
    ) -> Dict[str, Any]:
        """
        Isolate an endpoint from the network.
        Uses dual-channel approach:
        1. Try direct HTTP (immediate if agent online)
        2. Queue command (ensures delivery via polling)
        
        Args:
            hostname: The hostname of the endpoint to isolate
            initiated_by: Username of the person/system initiating the action
            reason: Reason for the isolation
            
        Returns:
            Dictionary containing the action result
        """
        timestamp = datetime.utcnow().isoformat()
        
        logger.warning(f"[STRIKE] 🚨 ISOLATION REQUEST for '{hostname}' by {initiated_by}")
        logger.info(f"[STRIKE] Reason: {reason}")
        
        params = {
            "hostname": hostname,
            "initiated_by": initiated_by,
            "reason": reason,
            "timestamp": timestamp
        }
        
        # ALWAYS queue the command first (most reliable)
        command_id = self._queue_command(
            hostname=hostname,
            command="network_isolate",
            params=params,
            initiated_by=initiated_by,
            priority=10  # High priority for isolation
        )
        
        # Get Sentinel URL for this endpoint
        sentinel_url = self._get_sentinel_url(hostname)
        
        if not sentinel_url:
            logger.warning(f"[STRIKE] ⚠️  No direct connection to '{hostname}' - command queued for polling")
            return {
                "success": True,
                "message": f"Isolation command queued for '{hostname}' - will execute when agent polls",
                "hostname": hostname,
                "action": "isolate",
                "timestamp": timestamp,
                "command_id": command_id,
                "delivery_method": "queued"
            }
        
        # Try direct HTTP for immediate response
        try:
            result = await self._send_command(
                sentinel_url=sentinel_url,
                command="network_isolate",
                params=params
            )
            
            # Log the action for audit trail
            self._log_action(
                action="isolate_endpoint",
                hostname=hostname,
                initiated_by=initiated_by,
                result=result
            )
            
            logger.info(f"[STRIKE] ✅ Endpoint '{hostname}' successfully isolated (direct)")
            
            return {
                "success": True,
                "message": f"Endpoint '{hostname}' has been isolated from the network",
                "hostname": hostname,
                "action": "isolate",
                "timestamp": timestamp,
                "command_id": command_id,
                "delivery_method": "direct",
                "details": result
            }
            
        except Exception as e:
            logger.warning(f"[STRIKE] ⚠️  Direct connection failed: {str(e)}")
            logger.info(f"[STRIKE] Command queued (ID: {command_id}) - agent will execute on next poll")
            return {
                "success": True,
                "message": f"Direct connection failed, but isolation command is queued for '{hostname}'",
                "hostname": hostname,
                "action": "isolate",
                "timestamp": timestamp,
                "command_id": command_id,
                "delivery_method": "queued",
                "note": "Agent will execute command on next poll (within 10 seconds)"
            }
    
    async def restore_endpoint(
        self,
        hostname: str,
        initiated_by: str
    ) -> Dict[str, Any]:
        """
        Restore network connectivity to a previously isolated endpoint.
        Uses dual-channel approach (queue + direct HTTP).
        """
        timestamp = datetime.utcnow().isoformat()
        
        logger.info(f"[STRIKE] 🔓 RESTORE REQUEST for '{hostname}' by {initiated_by}")
        
        params = {
            "hostname": hostname,
            "initiated_by": initiated_by,
            "timestamp": timestamp
        }
        
        # Queue the command
        command_id = self._queue_command(
            hostname=hostname,
            command="network_restore",
            params=params,
            initiated_by=initiated_by,
            priority=5  # Medium priority
        )
        
        sentinel_url = self._get_sentinel_url(hostname)
        
        if not sentinel_url:
            return {
                "success": True,
                "message": f"Restore command queued for '{hostname}'",
                "hostname": hostname,
                "action": "restore",
                "timestamp": timestamp,
                "command_id": command_id,
                "delivery_method": "queued"
            }
        
        # Try direct HTTP
        try:
            result = await self._send_command(
                sentinel_url=sentinel_url,
                command="network_restore",
                params=params
            )
            
            self._log_action(
                action="restore_endpoint",
                hostname=hostname,
                initiated_by=initiated_by,
                result=result
            )
            
            logger.info(f"[STRIKE] ✅ Endpoint '{hostname}' network access restored (direct)")
            
            return {
                "success": True,
                "message": f"Network access restored for '{hostname}'",
                "hostname": hostname,
                "action": "restore",
                "timestamp": timestamp,
                "command_id": command_id,
                "delivery_method": "direct",
                "details": result
            }
            
        except Exception as e:
            logger.warning(f"[STRIKE] ⚠️  Direct connection failed, command queued")
            return {
                "success": True,
                "message": f"Restore command queued for '{hostname}'",
                "hostname": hostname,
                "action": "restore",
                "timestamp": timestamp,
                "command_id": command_id,
                "delivery_method": "queued"
            }
    
    def _get_sentinel_url(self, hostname: str) -> Optional[str]:
        """
        Get the Sentinel URL for a given hostname.
        In production, this would query a database or service registry.
        """
        # For now, assume Sentinels are running on the same host on port 9090
        # In production, this would be stored in a database
        return self.sentinel_registry.get(hostname, f"http://{hostname}:9090")
    
    async def _send_command(
        self,
        sentinel_url: str,
        command: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send a command to a Sentinel agent.
        """
        endpoint = f"{sentinel_url}/command"
        
        payload = {
            "command": command,
            "params": params
        }
        
        print(f"[STRIKE DEBUG] Sending command to: {endpoint}")
        print(f"[STRIKE DEBUG] Payload: {payload}")
        
        async with httpx.AsyncClient(timeout=self.action_timeout, verify=False) as client:
            try:
                response = await client.post(endpoint, json=payload)
                response.raise_for_status()
                print(f"[STRIKE DEBUG] Response: {response.status_code}")
                return response.json()
            except httpx.TimeoutException as e:
                logger.error(f"[STRIKE] Timeout connecting to Sentinel at {sentinel_url}")
                print(f"[STRIKE DEBUG] Timeout error: {e}")
                raise Exception(f"Sentinel timeout: {sentinel_url}")
            except httpx.HTTPStatusError as e:
                logger.error(f"[STRIKE] HTTP error from Sentinel: {e.response.status_code}")
                print(f"[STRIKE DEBUG] HTTP error: {e}")
                raise Exception(f"Sentinel returned error: {e.response.status_code}")
            except httpx.ConnectError as e:
                logger.error(f"[STRIKE] Connection error to Sentinel at {sentinel_url}: {e}")
                print(f"[STRIKE DEBUG] Connection error: {e}")
                raise Exception(f"Cannot connect to Sentinel: {e}")
            except Exception as e:
                logger.error(f"[STRIKE] Error communicating with Sentinel: {str(e)}")
                print(f"[STRIKE DEBUG] General error: {type(e).__name__}: {e}")
                raise
    
    def _log_action(
        self,
        action: str,
        hostname: str,
        initiated_by: str,
        result: Dict[str, Any]
    ):
        """
        Log security actions for audit trail and compliance.
        In production, this would write to a secure audit log database.
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "hostname": hostname,
            "initiated_by": initiated_by,
            "success": result.get("success", False),
            "details": result
        }
        
        # Log to file (in production, write to secure database)
        logger.info(f"[AUDIT] {log_entry}")
        
        # TODO: Write to audit database
        # TODO: Send notification to security team
        # TODO: Update incident timeline


# Global Strike Orchestrator instance
strike_orchestrator = StrikeOrchestrator()
