using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Users.Dtos;
using Piggino.Api.Domain.Users.Interfaces;
using Piggino.Api.Infrastructure.Localization;

namespace Piggino.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<UserReadDto>> Get(Guid id)
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
            return CreatedAtAction(nameof(Get), new { id = createdUser.Id }, createdUser);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Put(Guid id, UserUpdateDto dto)
        {
            bool success = await _service.UpdateAsync(id, dto);
            return success ? NoContent() : NotFound();
        }

        [HttpPut("{id:guid}/password")]
        public async Task<IActionResult> UpdatePassword(Guid id, UserPasswordUpdateDto dto)
        {
            bool success = await _service.UpdatePasswordAsync(id, dto);
            return success ? NoContent() : BadRequest(MessageProvider.Get("InvalidCredentialsOrUserNotFound"));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            bool success = await _service.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }
    }
}
