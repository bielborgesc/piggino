using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Budgets.Dtos;
using Piggino.Api.Domain.Budgets.Interfaces;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BudgetsController : ControllerBase
    {
        private readonly IBudgetService _service;

        public BudgetsController(IBudgetService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BudgetReadDto>>> GetBudgets()
        {
            IEnumerable<BudgetReadDto> budgets = await _service.GetAllAsync();
            return Ok(budgets);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BudgetReadDto>> GetBudgetById(int id)
        {
            BudgetReadDto? budget = await _service.GetByIdAsync(id);

            if (budget == null)
                return NotFound();

            return Ok(budget);
        }

        [HttpPost]
        public async Task<ActionResult<BudgetReadDto>> CreateBudget(BudgetCreateDto createDto)
        {
            BudgetReadDto newBudget = await _service.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetBudgetById), new { id = newBudget.Id }, newBudget);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudget(int id)
        {
            bool success = await _service.DeleteAsync(id);

            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPost("{id}/expenses")]
        public async Task<ActionResult<BudgetExpenseReadDto>> AddExpense(int id, BudgetExpenseCreateDto createDto)
        {
            BudgetExpenseReadDto? expense = await _service.AddExpenseAsync(id, createDto);

            if (expense == null)
                return NotFound();

            return Ok(expense);
        }

        [HttpDelete("{id}/expenses/{expenseId}")]
        public async Task<IActionResult> DeleteExpense(int id, int expenseId)
        {
            bool success = await _service.DeleteExpenseAsync(id, expenseId);

            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}
