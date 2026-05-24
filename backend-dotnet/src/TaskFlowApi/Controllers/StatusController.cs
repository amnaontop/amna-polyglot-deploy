using Microsoft.AspNetCore.Mvc;

namespace TaskFlowApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class StatusController : ControllerBase
    {
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new
            {
                message = "TaskFlow API is Live!",
                version = "v1.0.0",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("tasks")]
        public IActionResult GetTasks()
        {
            var tasks = new[]
            {
                new { id = 1, title = "Setup Docker", status = "done" },
                new { id = 2, title = "Deploy to Cloud", status = "pending" },
                new { id = 3, title = "Configure Jenkins", status = "pending" }
            };
            return Ok(tasks);
        }

        [HttpPost("tasks")]
        public IActionResult CreateTask([FromBody] TaskRequest request)
        {
            return Ok(new
            {
                message = "Task created!",
                task = request
            });
        }
    }

    public class TaskRequest
    {
        public string Title { get; set; } = "";
        public string Status { get; set; } = "pending";
    }
}