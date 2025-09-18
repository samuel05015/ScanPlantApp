using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ScanPlantAPI.Controllers;
using ScanPlantAPI.Models.DTOs;
using ScanPlantAPI.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace ScanPlantAPI.Tests.Controllers
{
    public class PlantsControllerTests
    {
        private readonly Mock<IPlantService> _mockPlantService;
        private readonly PlantsController _controller;
        private readonly string _userId = "test-user-id";

        public PlantsControllerTests()
        {
            _mockPlantService = new Mock<IPlantService>();
            _controller = new PlantsController(_mockPlantService.Object);

            // Configurar o contexto HTTP com um usuário autenticado
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, _userId),
                new Claim(ClaimTypes.Name, "test@example.com")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = new DefaultHttpContext() { User = user }
            };
        }

        [Fact]
        public async Task GetAllPlants_ReturnsOkResult_WithPlants()
        {
            // Arrange
            var testPlants = GetTestPlantResponses();
            _mockPlantService.Setup(service => service.GetAllPlantsAsync())
                .ReturnsAsync(testPlants);

            // Act
            var result = await _controller.GetAllPlants();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<PlantResponseDTO>>(okResult.Value);
            Assert.Equal(testPlants, returnValue);
        }

        [Fact]
        public async Task GetMyPlants_ReturnsOkResult_WithUserPlants()
        {
            // Arrange
            var testPlants = GetTestPlantResponses();
            _mockPlantService.Setup(service => service.GetPlantsByUserIdAsync(_userId))
                .ReturnsAsync(testPlants);

            // Act
            var result = await _controller.GetMyPlants();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<PlantResponseDTO>>(okResult.Value);
            Assert.Equal(testPlants, returnValue);
        }

        [Fact]
        public async Task GetPlantById_ReturnsOkResult_WithPlant()
        {
            // Arrange
            var testPlant = GetTestPlantResponses()[0];
            _mockPlantService.Setup(service => service.GetPlantByIdAsync(1))
                .ReturnsAsync(testPlant);

            // Act
            var result = await _controller.GetPlantById(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<PlantResponseDTO>(okResult.Value);
            Assert.Equal(testPlant, returnValue);
        }

        [Fact]
        public async Task GetPlantById_ReturnsNotFound_ForInvalidId()
        {
            // Arrange
            _mockPlantService.Setup(service => service.GetPlantByIdAsync(999))
                .ReturnsAsync((PlantResponseDTO)null);

            // Act
            var result = await _controller.GetPlantById(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeletePlant_ReturnsNoContent_WhenSuccessful()
        {
            // Arrange
            _mockPlantService.Setup(service => service.DeletePlantAsync(1, _userId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeletePlant(1);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeletePlant_ReturnsNotFound_WhenPlantNotFound()
        {
            // Arrange
            _mockPlantService.Setup(service => service.DeletePlantAsync(999, _userId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeletePlant(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        private List<PlantResponseDTO> GetTestPlantResponses()
        {
            return new List<PlantResponseDTO>
            {
                new PlantResponseDTO
                {
                    Id = 1,
                    ImageUrl = "https://example.com/image1.jpg",
                    ScientificName = "Rosa gallica",
                    CommonName = "Rosa Francesa",
                    WikiDescription = "Descrição da Rosa Francesa",
                    Family = "Rosaceae",
                    Genus = "Rosa",
                    Latitude = 40.7128,
                    Longitude = -74.0060,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UserId = _userId
                },
                new PlantResponseDTO
                {
                    Id = 2,
                    ImageUrl = "https://example.com/image2.jpg",
                    ScientificName = "Tulipa gesneriana",
                    CommonName = "Tulipa",
                    WikiDescription = "Descrição da Tulipa",
                    Family = "Liliaceae",
                    Genus = "Tulipa",
                    Latitude = 40.7128,
                    Longitude = -74.0060,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UserId = _userId
                }
            };
        }
    }
}