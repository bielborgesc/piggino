using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Transactions.Dtos;
using Piggino.Api.Domain.Transactions.Interfaces;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionService _service;

        public TransactionsController(ITransactionService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransactionReadDto>>> GetTransactions()
        {
            IEnumerable<TransactionReadDto> transactions = await _service.GetAllAsync();
            return Ok(transactions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TransactionReadDto>> GetTransactionById(int id)
        {
            TransactionReadDto? transaction = await _service.GetByIdAsync(id);

            if (transaction == null)
            {
                return NotFound();
            }

            return Ok(transaction);
        }

        [HttpPost]
        public async Task<ActionResult<TransactionReadDto>> CreateTransaction(TransactionCreateDto createDto)
        {
            try
            {
                TransactionReadDto newTransaction = await _service.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetTransactionById), new { id = newTransaction.Id }, newTransaction);
            }
            catch (InvalidOperationException ex)
            {
                // Retorna um erro 400 Bad Request se a categoria ou fonte financeira não pertencer ao utilizador
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(int id, TransactionUpdateDto updateDto)
        {
            try
            {
                bool success = await _service.UpdateAsync(id, updateDto);

                if (!success)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            bool success = await _service.DeleteAsync(id);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPatch("installments/{installmentId}/toggle-paid")]
        public async Task<IActionResult> ToggleInstallmentPaidStatus(int installmentId)
        {
            var success = await _service.ToggleInstallmentPaidStatusAsync(installmentId);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpPatch("{transactionId}/toggle-paid")]
        public async Task<IActionResult> ToggleTransactionPaidStatus(int transactionId)
        {
            var success = await _service.ToggleTransactionPaidStatusAsync(transactionId);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
