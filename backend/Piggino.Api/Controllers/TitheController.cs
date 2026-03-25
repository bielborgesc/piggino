using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Tithe.Dtos;
using Piggino.Api.Domain.Tithe.Interfaces;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Interfaces;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/tithe")]
    [Authorize]
    public class TitheController : ControllerBase
    {
        private readonly ITitheService _titheService;
        private readonly IUserService _userService;

        public TitheController(ITitheService titheService, IUserService userService)
        {
            _titheService = titheService;
            _userService = userService;
        }

        [HttpGet("status")]
        public async Task<ActionResult<TitheStatusDto>> GetStatus()
        {
            if (!TryGetCurrentUserId(out Guid userId))
                return Unauthorized();

            TitheStatusDto status = await _titheService.GetStatusAsync(userId);
            return Ok(status);
        }

        [HttpPatch("toggle")]
        public async Task<ActionResult<UserSettingsDto>> Toggle([FromBody] TitheToggleDto dto)
        {
            if (!TryGetCurrentUserId(out Guid userId))
                return Unauthorized();

            UserSettingsDto? settings = await _userService.ToggleTitheModuleAsync(userId, dto.Enabled);
            if (settings == null)
                return NotFound();

            return Ok(settings);
        }

        [HttpPost("generate")]
        public async Task<ActionResult> Generate()
        {
            if (!TryGetCurrentUserId(out Guid userId))
                return Unauthorized();

            DateTime now = DateTime.UtcNow;
            int createdCount = await _titheService.GenerateMonthlyTitheAsync(userId, now.Year, now.Month);

            if (createdCount == 0)
                return Conflict(new { message = "No tithe transactions created. They may already exist or no titheable income was found." });

            return Ok(new { message = $"{createdCount} tithe transaction(s) created successfully." });
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            string? claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out userId);
        }
    }
}
