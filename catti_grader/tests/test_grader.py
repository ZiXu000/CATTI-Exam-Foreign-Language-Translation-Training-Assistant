import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.grader import GraderResponse, EvaluationItem

client = TestClient(app)

@pytest.fixture
def mock_openai_create():
    with patch("app.services.llm_service.AsyncOpenAI") as mock_client:
        mock_instance = AsyncMock()
        mock_client.return_value = mock_instance
        yield mock_instance.chat.completions.create

def test_grade_endpoint_success(mock_openai_create):
    # Setup mock response
    mock_response_json = """
    {
      "final_score": 98.0,
      "evaluations": [
        {
          "source_snippet": "The new policy will be implemented next month.",
          "user_translation": "新政策将在明年实施。",
          "error_type": "Major Mistranslation",
          "penalty": 2.0,
          "suggestion": "The word 'next month' means '下个月', not '明年'. According to the context, this is a major mistranslation."
        }
      ],
      "gold_standard": "新政策将于下个月实施。旨在提高工作流程的整体效率。",
      "glossary": [
        {
          "word": "efficiency",
          "pos": "n.",
          "definition": "the ratio of the useful work performed by a machine or in a process to the total energy expended or heat taken in.",
          "example": "Greater energy efficiency."
        }
      ]
    }
    """
    
    mock_openai_create.return_value.choices = [
        type("Choice", (), {"message": type("Message", (), {"content": mock_response_json})()})()
    ]

    request_payload = {
        "source_text": "The new policy will be implemented next month. It aims to improve the overall efficiency of the workflow.",
        "user_translation": "新政策将在明年实施。它的目的是提高工作流程的整体效率。",
        "provider": "deepseek",
        "api_key": "sk-mock-key",
        "language": "en"
    }

    response = client.post("/api/v1/grade", json=request_payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["final_score"] == 98.0
    assert len(data["evaluations"]) == 1
    assert data["evaluations"][0]["error_type"] == "Major Mistranslation"
    assert data["evaluations"][0]["penalty"] == 2.0
    
    # Check if English was requested in prompt
    called_args, called_kwargs = mock_openai_create.call_args
    messages = called_kwargs["messages"]
    system_prompt = messages[0]["content"]
    assert "MUST be written entirely in English" in system_prompt

def test_grade_endpoint_paper_town_trap_empty(mock_openai_create):
    # Test that empty translation triggers the trap in prompt
    mock_response_json = """
    {
      "final_score": 0.0,
      "evaluations": [],
      "gold_standard": "参考译文",
      "glossary": []
    }
    """
    
    mock_openai_create.return_value.choices = [
        type("Choice", (), {"message": type("Message", (), {"content": mock_response_json})()})()
    ]

    request_payload = {
        "source_text": "The new policy will be implemented next month.",
        "user_translation": "",
        "provider": "mimo",
        "api_key": "sk-mock-key",
        "language": "zh"
    }

    response = client.post("/api/v1/grade", json=request_payload)
    
    assert response.status_code == 200
    
    # Verify that the trap was included in the prompt
    called_args, called_kwargs = mock_openai_create.call_args
    messages = called_kwargs["messages"]
    system_prompt = messages[0]["content"]
    assert "据 N-Gram 语义衰减原则，此处必须降级处理" in system_prompt
    assert "MUST be written entirely in Chinese (Simplified)" in system_prompt
