"""
Voltaxe Clarity Hub - Authentication Service
Production-ready authentication with Supabase integration
"""

import os
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from jose import JWTError, jwt
from passlib.context import CryptContext
import datetime
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# JWT configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

class AuthService:
    """Production-ready authentication service with Supabase integration"""
    
    def __init__(self):
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            self.supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            self.service_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_SERVICE_KEY else None
            self.use_supabase = True
            print("[AUTH] ✅ Supabase authentication enabled")
        else:
            self.supabase: Optional[Client] = None
            self.service_client: Optional[Client] = None
            self.use_supabase = False
            print("[AUTH] ⚠️  Using fallback authentication (configure Supabase for production)")
    
    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user with Supabase or fallback system"""
        
        if self.use_supabase and self.supabase:
            try:
                # Supabase authentication
                response = self.supabase.auth.sign_in_with_password({
                    "email": email,
                    "password": password
                })
                
                if response.user and response.session:
                    return {
                        "user_id": response.user.id,
                        "email": response.user.email,
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "provider": "supabase"
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid credentials"
                    )
                    
            except Exception as e:
                print(f"[AUTH] Supabase authentication error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed"
                )
        else:
            # Fallback authentication for development
            return await self._fallback_authenticate(email, password)
    
    async def _fallback_authenticate(self, email: str, password: str) -> Dict[str, Any]:
        """Fallback authentication system for development"""
        
        # Development users - replace with real user database
        dev_users = {
            "admin@voltaxe.com": {
                "password": "password",
                "role": "admin",
                "name": "Voltaxe Admin"
            },
            "analyst@voltaxe.com": {
                "password": "analyst123",
                "role": "analyst", 
                "name": "Security Analyst"
            }
        }
        
        user = dev_users.get(email)
        if not user or user["password"] != password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Generate JWT token
        token_data = {
            "sub": email,
            "email": email,
            "role": user["role"],
            "name": user["name"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
        }
        
        access_token = jwt.encode(token_data, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return {
            "user_id": email,
            "email": email,
            "access_token": access_token,
            "refresh_token": "dev_refresh_token",
            "provider": "fallback",
            "user": user
        }
    
    async def verify_token(self, credentials: HTTPAuthorizationCredentials) -> Dict[str, Any]:
        """Verify JWT token or Supabase token"""
        
        token = credentials.credentials
        
        if self.use_supabase and self.supabase:
            try:
                # Verify Supabase token
                response = self.supabase.auth.get_user(token)
                if response and response.user:
                    return {
                        "user_id": response.user.id,
                        "email": response.user.email,
                        "provider": "supabase"
                    }
            except Exception as e:
                print(f"[AUTH] Supabase token verification error: {e}")
        
        # Fallback JWT verification
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    async def register_user(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """Register new user with Supabase or fallback system"""
        
        if self.use_supabase and self.supabase:
            try:
                response = self.supabase.auth.sign_up({
                    "email": email,
                    "password": password,
                    "options": {
                        "data": {
                            "name": name,
                            "role": "analyst"  # Default role
                        }
                    }
                })
                
                if response.user:
                    return {
                        "user_id": response.user.id,
                        "email": response.user.email,
                        "message": "User registered successfully. Please check your email for verification.",
                        "provider": "supabase"
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Registration failed"
                    )
                    
            except Exception as e:
                print(f"[AUTH] Supabase registration error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration failed"
                )
        else:
            # Fallback registration
            return {
                "message": "User registration not available in development mode. Configure Supabase for production.",
                "provider": "fallback"
            }
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        
        if self.use_supabase and self.supabase:
            try:
                response = self.supabase.auth.refresh_session(refresh_token)
                if response.session:
                    return {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "provider": "supabase"
                    }
            except Exception as e:
                print(f"[AUTH] Token refresh error: {e}")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to refresh token"
        )

# Global auth service instance
auth_service = AuthService()

# Dependency for protected routes
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    return await auth_service.verify_token(credentials)

# Pydantic models for authentication
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: Dict[str, Any]
    message: str = "Login successful"

class RegisterResponse(BaseModel):
    message: str
    user_id: Optional[str] = None