using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ScanPlantAPI.Data;
using ScanPlantAPI.Models;
using ScanPlantAPI.Models.DTOs;
using ScanPlantAPI.Services;
using ScanPlantAPI.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ScanPlantAPI.Tests.Services
{
    public class PlantServiceTests
    {
        private readonly Mock<IStorageService> _mockStorageService;
        private readonly DbContextOptions<ApplicationDbContext> _options;
        private readonly IConfiguration _configuration;

        public PlantServiceTests()
        {
            _mockStorageService = new Mock<IStorageService>();
            
            // Configuração para usar banco de dados em memória
            _options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            // Configuração mock
            var inMemorySettings = new Dictionary<string, string> {
                {"Jwt:Key", "TestKey"},
                {"Jwt:Issuer", "TestIssuer"},
                {"Jwt:Audience", "TestAudience"},
                {"Jwt:DurationInMinutes", "60"}
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
        }

        private ApplicationDbContext GetDbContext()
        {
            var context = new ApplicationDbContext(_options);
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            return context;
        }

        [Fact]
        public async Task GetAllPlantsAsync_ReturnsAllPlants()
        {
            // Arrange
            using var context = GetDbContext();
            var testPlants = GetTestPlants();
            context.Plants.AddRange(testPlants);
            await context.SaveChangesAsync();

            var service = new PlantService(context, _mockStorageService.Object);

            // Act
            var result = await service.GetAllPlantsAsync();

            // Assert
            Assert.Equal(testPlants.Count, result.Count());
        }

        [Fact]
        public async Task GetPlantsByUserIdAsync_ReturnsUserPlants()
        {
            // Arrange
            using var context = GetDbContext();
            var testPlants = GetTestPlants();
            context.Plants.AddRange(testPlants);
            await context.SaveChangesAsync();

            var service = new PlantService(context, _mockStorageService.Object);
            var userId = "user1";

            // Act
            var result = await service.GetPlantsByUserIdAsync(userId);

            // Assert
            Assert.Equal(2, result.Count()); // user1 tem 2 plantas
            Assert.All(result, plant => Assert.Equal(userId, plant.UserId));
        }

        [Fact]
        public async Task GetPlantByIdAsync_ReturnsCorrectPlant()
        {
            // Arrange
            using var context = GetDbContext();
            var testPlants = GetTestPlants();
            context.Plants.AddRange(testPlants);
            await context.SaveChangesAsync();

            var service = new PlantService(context, _mockStorageService.Object);
            var plantId = 1;

            // Act
            var result = await service.GetPlantByIdAsync(plantId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(plantId, result.Id);
        }

        [Fact]
        public async Task GetPlantByIdAsync_ReturnsNullForInvalidId()
        {
            // Arrange
            using var context = GetDbContext();
            var testPlants = GetTestPlants();
            context.Plants.AddRange(testPlants);
            await context.SaveChangesAsync();

            var service = new PlantService(context, _mockStorageService.Object);
            var invalidId = 999;

            // Act
            var result = await service.GetPlantByIdAsync(invalidId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task SearchPlantsByNameAsync_ReturnsMatchingPlants()
        {
            // Arrange
            using var context = GetDbContext();
            var testPlants = GetTestPlants();
            context.Plants.AddRange(testPlants);
            await context.SaveChangesAsync();

            var service = new PlantService(context, _mockStorageService.Object);
            var searchTerm = "rosa";

            // Act
            var result = await service.SearchPlantsByNameAsync(searchTerm);

            // Assert
            Assert.Single(result);
            Assert.Contains(result, p => p.ScientificName.ToLower().Contains(searchTerm));
        }

        private List<Plant> GetTestPlants()
        {
            return new List<Plant>
            {
                new Plant
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
                    UserId = "user1"
                },
                new Plant
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
                    UserId = "user1"
                },
                new Plant
                {
                    Id = 3,
                    ImageUrl = "https://example.com/image3.jpg",
                    ScientificName = "Lavandula angustifolia",
                    CommonName = "Lavanda",
                    WikiDescription = "Descrição da Lavanda",
                    Family = "Lamiaceae",
                    Genus = "Lavandula",
                    Latitude = 34.0522,
                    Longitude = -118.2437,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    UserId = "user2"
                }
            };
        }
    }
}