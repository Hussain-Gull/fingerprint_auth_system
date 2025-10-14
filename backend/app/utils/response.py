"""
Centralized API Response Utilities
=================================
This module provides standardized response and error handling utilities
for consistent API responses across the application.
"""

from typing import Any, Dict, Optional, Union
from fastapi import HTTPException
from fastapi.responses import JSONResponse
import logging
from datetime import datetime

log = logging.getLogger("utils.response")


class APIResponse:
    """Standardized API response structure."""
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = 200,
        meta: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """
        Create a standardized success response.
        
        Args:
            data: The response data
            message: Success message
            status_code: HTTP status code
            meta: Additional metadata
            
        Returns:
            JSONResponse with standardized format
        """
        response_data = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        if meta:
            response_data["meta"] = meta
            
        return JSONResponse(
            status_code=status_code,
            content=response_data
        )
    
    @staticmethod
    def error(
        message: str = "An error occurred",
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """
        Create a standardized error response.
        
        Args:
            message: Error message
            status_code: HTTP status code
            error_code: Custom error code
            details: Additional error details
            
        Returns:
            JSONResponse with standardized error format
        """
        response_data = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        if error_code:
            response_data["error_code"] = error_code
            
        if details:
            response_data["details"] = details
            
        return JSONResponse(
            status_code=status_code,
            content=response_data
        )
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = "Resource created successfully",
        meta: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """Create a standardized 201 Created response."""
        return APIResponse.success(
            data=data,
            message=message,
            status_code=201,
            meta=meta
        )
    
    @staticmethod
    def no_content(message: str = "Operation completed successfully") -> JSONResponse:
        """Create a standardized 204 No Content response."""
        return JSONResponse(
            status_code=204,
            content={
                "success": True,
                "message": message,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )


class APIError:
    """Centralized error handling utilities."""
    
    @staticmethod
    def bad_request(
        message: str = "Bad Request",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 400 Bad Request error."""
        return HTTPException(
            status_code=400,
            detail={
                "message": message,
                "error_code": "BAD_REQUEST",
                "details": details
            }
        )
    
    @staticmethod
    def unauthorized(
        message: str = "Unauthorized",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 401 Unauthorized error."""
        return HTTPException(
            status_code=401,
            detail={
                "message": message,
                "error_code": "UNAUTHORIZED",
                "details": details
            }
        )
    
    @staticmethod
    def forbidden(
        message: str = "Forbidden",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 403 Forbidden error."""
        return HTTPException(
            status_code=403,
            detail={
                "message": message,
                "error_code": "FORBIDDEN",
                "details": details
            }
        )
    
    @staticmethod
    def not_found(
        message: str = "Resource not found",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 404 Not Found error."""
        return HTTPException(
            status_code=404,
            detail={
                "message": message,
                "error_code": "NOT_FOUND",
                "details": details
            }
        )
    
    @staticmethod
    def conflict(
        message: str = "Resource conflict",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 409 Conflict error."""
        return HTTPException(
            status_code=409,
            detail={
                "message": message,
                "error_code": "CONFLICT",
                "details": details
            }
        )
    
    @staticmethod
    def unprocessable_entity(
        message: str = "Unprocessable Entity",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 422 Unprocessable Entity error."""
        return HTTPException(
            status_code=422,
            detail={
                "message": message,
                "error_code": "UNPROCESSABLE_ENTITY",
                "details": details
            }
        )
    
    @staticmethod
    def service_unavailable(
        message: str = "Service unavailable",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 503 Service Unavailable error."""
        return HTTPException(
            status_code=503,
            detail={
                "message": message,
                "error_code": "SERVICE_UNAVAILABLE",
                "details": details
            }
        )
    
    @staticmethod
    def internal_server_error(
        message: str = "Internal server error",
        details: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """Create a 500 Internal Server Error."""
        return HTTPException(
            status_code=500,
            detail={
                "message": message,
                "error_code": "INTERNAL_SERVER_ERROR",
                "details": details
            }
        )


class ServiceResponse:
    """Utilities for service-level responses (not HTTP responses)."""
    
    @staticmethod
    def success(data: Any = None, message: str = "Success") -> Dict[str, Any]:
        """Create a service success response."""
        return {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    @staticmethod
    def error(message: str = "Error", error_code: Optional[str] = None) -> Dict[str, Any]:
        """Create a service error response."""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        if error_code:
            response["error_code"] = error_code
            
        return response


# Convenience functions for common patterns
def success_response(data: Any = None, message: str = "Success", **kwargs) -> JSONResponse:
    """Convenience function for success responses."""
    return APIResponse.success(data=data, message=message, **kwargs)


def error_response(message: str = "Error", status_code: int = 500, **kwargs) -> JSONResponse:
    """Convenience function for error responses."""
    return APIResponse.error(message=message, status_code=status_code, **kwargs)


def created_response(data: Any = None, message: str = "Created", **kwargs) -> JSONResponse:
    """Convenience function for created responses."""
    return APIResponse.created(data=data, message=message, **kwargs)
