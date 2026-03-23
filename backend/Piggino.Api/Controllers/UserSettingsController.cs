using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Interfaces;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/user-settings")]
    [Authorize]
    public class UserSettingsController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserSettingsController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<UserSettingsDto>> GetSettings()
        {
            if (!TryGetCurrentUserId(out Guid userId))
                return Unauthorized();

            UserSettingsDto? settings = await _userService.GetSettingsAsync(userId);
            if (settings == null)
                return NotFound();

            return Ok(settings);
        }

        [HttpPut]
        public async Task<ActionResult<UserSettingsDto>> UpdateSettings([FromBody] UserSettingsDto dto)
        {
            if (!TryGetCurrentUserId(out Guid userId))
                return Unauthorized();

            UserSettingsDto? updated = await _userService.UpdateSettingsAsync(userId, dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            string? claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out userId);
        }
    }
}
