import time
from typing import Any, Dict, Optional
from abc import ABC, abstractmethod
from utils.antigravity_utils import create_execution_metadata

class BaseAgent(ABC):
    """
    Base class for all CIRO Agents.
    Every agent must implement the execute method.
    """
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Returns the system prompt that defines the agent's behavior."""
        pass
        
    @abstractmethod
    def execute(self, input_data: Any, parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process the input data and return the structured response with metadata.
        """
        pass

    def get_agent_name(self) -> str:
        return self.__class__.__name__
