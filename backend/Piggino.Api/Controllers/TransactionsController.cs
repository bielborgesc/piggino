using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Transactions.Dtos;
using Piggino.Api.Domain.Transactions.Interfaces;
using Piggino.Api.Enum;

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
        public async Task<IActionResult> DeleteTransaction(int id, [FromQuery] RecurrenceScope scope = RecurrenceScope.OnlyThis)
        {
            bool success = await _service.DeleteAsync(id, scope);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}/installments/{installmentNumber}")]
        public async Task<IActionResult> DeleteInstallmentsByScope(
            int id,
            int installmentNumber,
            [FromQuery] RecurrenceScope scope = RecurrenceScope.OnlyThis)
        {
            bool success = await _service.DeleteInstallmentsByScope(id, installmentNumber, scope);

            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPut("{id}/installments/{installmentNumber}")]
        public async Task<IActionResult> UpdateInstallmentsByScope(
            int id,
            int installmentNumber,
            TransactionUpdateDto updateDto)
        {
            try
            {
                bool success = await _service.UpdateInstallmentsByScope(id, installmentNumber, updateDto);

                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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

        [HttpPost("invoices/pay")]
        public async Task<IActionResult> PayInvoice(
            [FromQuery] int financialSourceId,
            [FromQuery] string month)
        {
            if (!DateOnly.TryParseExact(month, "yyyy-MM", out DateOnly parsedMonth))
                return BadRequest(new { message = "Invalid month format. Use yyyy-MM." });

            bool success = await _service.PayInvoiceAsync(financialSourceId, parsedMonth.Year, parsedMonth.Month);

            if (!success)
                return NotFound(new { message = "Financial source not found." });

            return NoContent();
        }

        [HttpGet("invoices")]
        public async Task<ActionResult<InvoiceReadDto>> GetInvoice(
            [FromQuery] int financialSourceId,
            [FromQuery] string month)
        {
            if (!DateOnly.TryParseExact(month, "yyyy-MM", out DateOnly parsedMonth))
                return BadRequest(new { message = "Invalid month format. Use yyyy-MM." });

            InvoiceReadDto? invoice = await _service.GetInvoiceAsync(financialSourceId, parsedMonth.Year, parsedMonth.Month);

            if (invoice == null)
                return NotFound(new { message = "Financial source not found." });

            return Ok(invoice);
        }
    }
}
