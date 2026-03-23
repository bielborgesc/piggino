using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Helpers;
using Piggino.Api.Infrastructure.Localization;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int RefreshTokenExpiryDays = 7;

        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public AuthController(IUserRepository userRepository, ITokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            User? user = await _userRepository.GetUserByEmailAsync(loginDto.Email);

            if (user == null || !PasswordHelper.VerifyPasswordHash(loginDto.Password, user.PasswordHash, user.PasswordSalt))
            {
                return Unauthorized(new { message = MessageProvider.Get("InvalidCredentialsOrUserNotFound") });
            }

            return Ok(await IssueTokenPairAsync(user));
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
        {
            User? user = await _userRepository.GetUserByRefreshTokenAsync(dto.RefreshToken);

            if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiry <= DateTime.UtcNow)
            {
                return Unauthorized(new { message = MessageProvider.Get("InvalidOrExpiredRefreshToken") });
            }

            return Ok(await IssueTokenPairAsync(user));
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            string? userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized();
            }

            User? user = await _userRepository.GetUserByIdAsync(userId);

            if (user == null)
            {
                return Unauthorized();
            }

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userRepository.UpdateUserAsync(user);

            return NoContent();
        }

        private async Task<object> IssueTokenPairAsync(User user)
        {
            string accessToken = _tokenService.GenerateAccessToken(user);
            string refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays);
            await _userRepository.UpdateUserAsync(user);

            return new { AccessToken = accessToken, RefreshToken = refreshToken };
        }
    }
}
