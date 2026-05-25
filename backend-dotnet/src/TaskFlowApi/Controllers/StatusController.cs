using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace TaskFlowApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class StatusController : ControllerBase
    {
        private static readonly List<TaskItem> Tasks = new()
        {
            new TaskItem { Id = 1, Title = "Setup Docker", Status = "done", Priority = "high" },
            new TaskItem { Id = 2, Title = "Deploy to Cloud", Status = "pending", Priority = "medium" },
            new TaskItem { Id = 3, Title = "Configure Jenkins", Status = "pending", Priority = "low" }
        };

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
            return Ok(Tasks);
        }

        [HttpPost("tasks")]
        public IActionResult CreateTask([FromBody] TaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "Task title is required." });
            }

            var nextId = Tasks.Count > 0 ? Tasks.Max(t => t.Id) + 1 : 1;
            var created = new TaskItem
            {
                Id = nextId,
                Title = request.Title.Trim(),
                Status = string.IsNullOrWhiteSpace(request.Status) ? "pending" : request.Status,
                Priority = string.IsNullOrWhiteSpace(request.Priority) ? "low" : request.Priority
            };

            Tasks.Insert(0, created);
            return Ok(new
            {
                message = "Task created!",
                task = created
            });
        }
    }

    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public string Priority { get; set; } = "low";
    }

    public class TaskRequest
    {
        public string Title { get; set; } = "";
        public string Status { get; set; } = "pending";
        public string Priority { get; set; } = "low";
    }
}