import pytest
from unittest.mock import patch, AsyncMock
from app.schemas.interpreter_schema import GenerateExamRequest, GenerateExamResponse
from app.services.interpreter_llm_service import generate_exam

MOCK_TRANSCRIPT = """
Ladies and gentlemen, welcome to the annual economic forum. Today, I want to discuss the impact of global warming on coastal economies. The rising sea levels have caused significant damage to our infrastructure. In response, the government has proposed two new subsidy policies. First, a tax break for companies relocating inland. Second, a direct grant for building sea walls. However, critics argue these measures are too little, too late. They emphasize that without a drastic reduction in carbon emissions, subsidies will only be a temporary fix.
"""

MOCK_JSON_MODE_A = """
{
  "exam_type": "口译综合能力",
  "audio_meta": {"duration": 60, "word_count": 85},
  "questions": {
    "true_or_false": [
      {
        "id": "q1",
        "statement": "The government proposed three new subsidy policies.",
        "answer": "False",
        "distractor_logic": "Temporal/Number manipulation: Changed 'two' to 'three'."
      }
    ],
    "multiple_choice_short": [
      {
        "id": "q2",
        "question": "What is the first subsidy policy proposed?",
        "options": [
          "A. Tax break for relocating inland",
          "B. Direct grant for sea walls",
          "C. Carbon emission tax",
          "D. Relocation to coastal areas"
        ],
        "correct_answer": "A",
        "distractor_logic": "Option B is the second policy, C is related to critics, D is the opposite."
      }
    ],
    "multiple_choice_passage": [],
    "summary_rubric": {
      "source_word_count": 85,
      "required_word_count_target": 200,
      "key_scoring_points": [
        "1. Mention impact of global warming on coastal economies.",
        "2. Mention two subsidy policies.",
        "3. Mention tax break for inland relocation.",
        "4. Mention direct grant for sea walls.",
        "5. Mention critics' argument about carbon emissions."
      ]
    }
  }
}
"""

MOCK_JSON_MODE_B = """
{
  "exam_type": "口译实务",
  "audio_meta": {"duration": 60, "word_count": 85},
  "practice_data": {
    "chunks": [
      {
        "id": "c1",
        "text": "Ladies and gentlemen, welcome to the annual economic forum. Today, I want to discuss the impact of global warming on coastal economies.",
        "start_time": "00:00",
        "end_time": "00:15"
      },
      {
        "id": "c2",
        "text": "The rising sea levels have caused significant damage to our infrastructure. In response, the government has proposed two new subsidy policies.",
        "start_time": "00:15",
        "end_time": "00:30"
      }
    ]
  }
}
"""

@pytest.mark.asyncio
async def test_generate_exam_mode_a():
    request = GenerateExamRequest(
        exam_type="口译综合能力",
        transcript=MOCK_TRANSCRIPT,
        api_key="fake-key"
    )

    with patch("app.services.interpreter_llm_service.AsyncOpenAI") as MockClient:
        mock_client_instance = MockClient.return_value
        
        # Setup mock response
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = MOCK_JSON_MODE_A
        mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        
        response = await generate_exam(request)
        
        assert isinstance(response, GenerateExamResponse)
        assert response.exam_type == "口译综合能力"
        assert response.questions is not None
        assert len(response.questions.true_or_false) == 1
        assert response.questions.true_or_false[0].answer == "False"
        assert len(response.questions.summary_rubric.key_scoring_points) == 5

@pytest.mark.asyncio
async def test_generate_exam_mode_b():
    request = GenerateExamRequest(
        exam_type="口译实务",
        transcript=MOCK_TRANSCRIPT,
        api_key="fake-key"
    )

    with patch("app.services.interpreter_llm_service.AsyncOpenAI") as MockClient:
        mock_client_instance = MockClient.return_value
        
        # Setup mock response
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = MOCK_JSON_MODE_B
        mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        
        response = await generate_exam(request)
        
        assert isinstance(response, GenerateExamResponse)
        assert response.exam_type == "口译实务"
        assert response.practice_data is not None
        assert len(response.practice_data.chunks) == 2
        assert response.practice_data.chunks[0].id == "c1"
