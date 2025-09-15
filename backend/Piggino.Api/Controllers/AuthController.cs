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

            if (user == null)
            {
                return Unauthorized(new { message = MessageProvider.Get("InvalidCredentialsOrUserNotFound") });
            }

            if (!PasswordHelper.VerifyPasswordHash(loginDto.Password, user.PasswordHash, user.PasswordSalt))
            {
                return Unauthorized(new { message = MessageProvider.Get("InvalidCredentialsOrUserNotFound") });
            }

            string tokenString = _tokenService.GenerateToken(user);

            return Ok(new { Token = tokenString });
        }
    }
}
