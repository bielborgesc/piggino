using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Goals.Dtos;
using Piggino.Api.Domain.Goals.Interfaces;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GoalsController : ControllerBase
    {
        private readonly IGoalService _service;

        public GoalsController(IGoalService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GoalReadDto>>> GetGoals()
        {
            IEnumerable<GoalReadDto> goals = await _service.GetAllAsync();
            return Ok(goals);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GoalReadDto>> GetGoalById(int id)
        {
            GoalReadDto? goal = await _service.GetByIdAsync(id);

            if (goal == null)
                return NotFound();

            return Ok(goal);
        }

        [HttpPost]
        public async Task<ActionResult<GoalReadDto>> CreateGoal(GoalCreateDto createDto)
        {
            GoalReadDto newGoal = await _service.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetGoalById), new { id = newGoal.Id }, newGoal);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGoal(int id, GoalUpdateDto updateDto)
        {
            bool success = await _service.UpdateAsync(id, updateDto);

            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            bool success = await _service.DeleteAsync(id);

            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPost("{id}/contribute")]
        public async Task<ActionResult<GoalReadDto>> AddContribution(int id, AddContributionDto contributionDto)
        {
            GoalReadDto? updatedGoal = await _service.AddContributionAsync(id, contributionDto);

            if (updatedGoal == null)
                return NotFound();

            return Ok(updatedGoal);
        }
    }
}
