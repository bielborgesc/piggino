using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Services;
using Piggino.Api.Infrastructure.Localization;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _service;

        public UserController(IUserService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserReadDto>>> Get()
        {
            IEnumerable<UserReadDto> users = await _service.GetAllAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserReadDto>> Get(int id)
        {
            UserReadDto? user = await _service.GetByIdAsync(id);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<UserReadDto>> Post(UserCreateDto dto)
        {
            UserReadDto createdUser = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(Get), new { id = createdUser.Email }, createdUser);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, UserUpdateDto dto)
        {
            bool success = await _service.UpdateAsync(id, dto);
            return success ? NoContent() : NotFound();
        }

        [HttpPut("{id}/password")]
        public async Task<IActionResult> UpdatePassword(int id, UserPasswordUpdateDto dto)
        {
            bool success = await _service.UpdatePasswordAsync(id, dto);
            return success ? NoContent() : BadRequest(MessageProvider.Get("InvalidCredentialsOrUserNotFound"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool success = await _service.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }
    }
}
