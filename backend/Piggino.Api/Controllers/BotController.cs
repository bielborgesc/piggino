using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Piggino.Api.Domain.Bot.Dtos;
using Piggino.Api.Domain.Bot.Interfaces;
using Piggino.Api.Settings;
using System.Security.Claims;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BotController : ControllerBase
    {
        private const string BotSecretHeaderName = "X-Bot-Secret";

        private readonly IBotService _botService;
        private readonly BotSettings _botSettings;

        public BotController(IBotService botService, IOptions<BotSettings> botSettings)
        {
            _botService = botService;
            _botSettings = botSettings.Value;
        }

        [Authorize]
        [HttpPost("link-token")]
        public async Task<IActionResult> GenerateLinkToken()
        {
            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            BotLinkTokenResponseDto result = await _botService.GenerateLinkTokenAsync(userId);

            return Ok(result);
        }

        [Authorize]
        [HttpPost("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            await _botService.DisconnectAsync(userId);

            return Ok(new { message = "All Telegram accounts disconnected successfully." });
        }

        [Authorize]
        [HttpGet("connections")]
        public async Task<IActionResult> GetConnections()
        {
            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var connections = await _botService.GetConnectionsAsync(userId);

            return Ok(connections);
        }

        [Authorize]
        [HttpDelete("connections/{id:int}")]
        public async Task<IActionResult> DisconnectSpecific(int id)
        {
            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            await _botService.DisconnectSpecificAsync(userId, id);

            return Ok(new { message = "Telegram account disconnected successfully." });
        }

        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] BotConnectDto dto)
        {
            bool connected = await _botService.ConnectAsync(dto);

            if (!connected)
                return BadRequest(new { message = "Invalid or expired token." });

            return Ok(new { message = "Telegram account connected successfully." });
        }

        [HttpGet("context/{chatId}")]
        public async Task<IActionResult> GetContext(string chatId)
        {
            if (!IsBotSecretValid())
                return Unauthorized(new { message = "Invalid bot secret." });

            BotContextDto? context = await _botService.GetContextAsync(chatId);

            if (context == null)
                return NotFound(new { message = "No user linked to this chat." });

            return Ok(context);
        }

        [HttpPost("transaction")]
        public async Task<IActionResult> CreateTransaction([FromBody] BotTransactionDto dto)
        {
            if (!IsBotSecretValid())
                return Unauthorized(new { message = "Invalid bot secret." });

            bool created = await _botService.CreateTransactionAsync(dto);

            if (!created)
                return NotFound(new { message = "No user linked to this chat." });

            return Created(string.Empty, new { message = "Transaction recorded." });
        }

        [HttpGet("summary/{chatId}")]
        public async Task<IActionResult> GetSummary(string chatId)
        {
            if (!IsBotSecretValid())
                return Unauthorized(new { message = "Invalid bot secret." });

            BotSummaryDto? summary = await _botService.GetSummaryAsync(chatId);

            if (summary == null)
                return NotFound(new { message = "No user linked to this chat." });

            return Ok(summary);
        }

        private bool IsBotSecretValid()
        {
            if (!Request.Headers.TryGetValue(BotSecretHeaderName, out var providedSecret))
                return false;

            return providedSecret.ToString() == _botSettings.Secret;
        }
    }
}
