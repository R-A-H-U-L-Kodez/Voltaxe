"""
Strike Module - Automated Response Orchestrator
This module handles automated security response actions by communicating with Voltaxe Sentinels.
This is the "A" in CRaaS (Cyber Resilience-as-a-Service).
"""

import httpx
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class StrikeOrchestrator:
    """
    Orchestrates automated response actions across the Voltaxe platform.
    Communicates with Sentinels to execute security actions like endpoint isolation.
    """
    
    def __init__(self):
        # In production, these would be loaded from environment variables or config
        self.sentinel_registry: Dict[str, str] = {}
        self.action_timeout = 30.0  # seconds
        
    def register_sentinel(self, hostname: str, sentinel_url: str):
        """Register a Sentinel endpoint for a given hostname"""
        self.sentinel_registry[hostname] = sentinel_url
        logger.info(f"[STRIKE] Registered Sentinel for '{hostname}' at {sentinel_url}")
    
    async def isolate_endpoint(
        self,
        hostname: str,
        initiated_by: str,
        reason: str = "Security threat detected"
    ) -> Dict[str, Any]:
        """
        Isolate an endpoint from the network by communicating with its Sentinel.
        
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
        
        # Get Sentinel URL for this endpoint
        sentinel_url = self._get_sentinel_url(hostname)
        
        if not sentinel_url:
            logger.error(f"[STRIKE] ❌ No Sentinel registered for '{hostname}'")
            return {
                "success": False,
                "message": f"No Sentinel agent found for endpoint '{hostname}'",
                "hostname": hostname,
                "action": "isolate",
                "timestamp": timestamp
            }
        
        try:
            # Send isolation command to Sentinel
            result = await self._send_command(
                sentinel_url=sentinel_url,
                command="network_isolate",
                params={
                    "hostname": hostname,
                    "initiated_by": initiated_by,
                    "reason": reason,
                    "timestamp": timestamp
                }
            )
            
            # Log the action for audit trail
            self._log_action(
                action="isolate_endpoint",
                hostname=hostname,
                initiated_by=initiated_by,
                result=result
            )
            
            logger.info(f"[STRIKE] ✅ Endpoint '{hostname}' successfully isolated")
            
            return {
                "success": True,
                "message": f"Endpoint '{hostname}' has been isolated from the network",
                "hostname": hostname,
                "action": "isolate",
                "timestamp": timestamp,
                "details": result
            }
            
        except Exception as e:
            logger.error(f"[STRIKE] ❌ Failed to isolate '{hostname}': {str(e)}")
            return {
                "success": False,
                "message": f"Failed to isolate endpoint: {str(e)}",
                "hostname": hostname,
                "action": "isolate",
                "timestamp": timestamp
            }
    
    async def restore_endpoint(
        self,
        hostname: str,
        initiated_by: str
    ) -> Dict[str, Any]:
        """
        Restore network connectivity to a previously isolated endpoint.
        """
        timestamp = datetime.utcnow().isoformat()
        
        logger.info(f"[STRIKE] 🔓 RESTORE REQUEST for '{hostname}' by {initiated_by}")
        
        sentinel_url = self._get_sentinel_url(hostname)
        
        if not sentinel_url:
            return {
                "success": False,
                "message": f"No Sentinel agent found for endpoint '{hostname}'",
                "hostname": hostname,
                "action": "restore",
                "timestamp": timestamp
            }
        
        try:
            result = await self._send_command(
                sentinel_url=sentinel_url,
                command="network_restore",
                params={
                    "hostname": hostname,
                    "initiated_by": initiated_by,
                    "timestamp": timestamp
                }
            )
            
            self._log_action(
                action="restore_endpoint",
                hostname=hostname,
                initiated_by=initiated_by,
                result=result
            )
            
            logger.info(f"[STRIKE] ✅ Endpoint '{hostname}' network access restored")
            
            return {
                "success": True,
                "message": f"Network access restored for '{hostname}'",
                "hostname": hostname,
                "action": "restore",
                "timestamp": timestamp,
                "details": result
            }
            
        except Exception as e:
            logger.error(f"[STRIKE] ❌ Failed to restore '{hostname}': {str(e)}")
            return {
                "success": False,
                "message": f"Failed to restore endpoint: {str(e)}",
                "hostname": hostname,
                "action": "restore",
                "timestamp": timestamp
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
