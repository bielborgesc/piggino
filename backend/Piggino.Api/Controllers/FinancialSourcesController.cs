using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.FinancialSources.Dtos;
using Piggino.Api.Domain.FinancialSources.Interfaces;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinancialSourcesController : ControllerBase
    {
        private readonly IFinancialSourceService _service;

        public FinancialSourcesController(IFinancialSourceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FinancialSourceReadDto>>> GetFinancialSources()
        {
            IEnumerable<FinancialSourceReadDto> financialSources = await _service.GetAllAsync();
            return Ok(financialSources);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FinancialSourceReadDto>> GetFinancialSourceById(int id)
        {
            FinancialSourceReadDto? financialSource = await _service.GetByIdAsync(id);

            if (financialSource == null)
            {
                return NotFound();
            }

            return Ok(financialSource);
        }

        [HttpPost]
        public async Task<ActionResult<FinancialSourceReadDto>> CreateFinancialSource(FinancialSourceCreateDto createDto)
        {
            FinancialSourceReadDto newFinancialSource = await _service.CreateAsync(createDto);

            return CreatedAtAction(nameof(GetFinancialSourceById), new { id = newFinancialSource.Id }, newFinancialSource);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFinancialSource(int id, FinancialSourceUpdateDto updateDto)
        {
            bool success = await _service.UpdateAsync(id, updateDto);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFinancialSource(int id)
        {
            try // ✅ Adicionar try-catch
            {
                bool success = await _service.DeleteAsync(id);

                if (!success)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (InvalidOperationException ex) // ✅ Capturar a exceção
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
