using Microsoft.AspNetCore.Mvc;
using Piggino.Api.Domain.Users.Entities;
using Piggino.Api.Domain.Users.Services;

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
        public async Task<ActionResult<IEnumerable<User>>> Get()
        {
            List<User> users = [..(await _service.GetAllAsync())];
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> Get(int id)
        {
            User? user = await _service.GetByIdAsync(id);
            if (user is null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<User>> Post(User user)
        {
            User created = await _service.CreateAsync(user);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, User user)
        {
            bool success = await _service.UpdateAsync(id, user);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
