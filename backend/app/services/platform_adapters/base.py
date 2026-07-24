from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class CodingPlatformAdapter(ABC):
    """
    Abstract adapter for external competitive programming and coding challenge platforms.
    Enforces official API usage, rate-limit compliance, and reference workflows.
    """

    def __init__(self, api_endpoint: Optional[str] = None, api_key: Optional[str] = None):
        self.api_endpoint = api_endpoint
        self.api_key = api_key

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Validates API credentials and connectivity."""
        pass

    @abstractmethod
    async def search_problems(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Searches platform problems using official APIs."""
        pass

    @abstractmethod
    async def get_problem_metadata(self, problem_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves problem title, tags, difficulty, and permitted external reference URL."""
        pass
