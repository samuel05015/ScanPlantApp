using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using ScanPlantAPI.Models;
using ScanPlantAPI.Models.DTOs;
using ScanPlantAPI.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace ScanPlantAPI.Tests.Services
{
    public class UserServiceTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            // Configurar mock do UserManager
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            // Configurar mock do IConfiguration
            _mockConfiguration = new Mock<IConfiguration>();
            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns("test_jwt_secret_key_with_minimum_length_for_testing");
            _mockConfiguration.Setup(c => c.GetSection("JWT:Secret")).Returns(configSection.Object);
            _mockConfiguration.Setup(c => c.GetSection("JWT:ValidIssuer")).Returns(configSection.Object);
            _mockConfiguration.Setup(c => c.GetSection("JWT:ValidAudience")).Returns(configSection.Object);

            // Criar instância do serviço
            _userService = new UserService(_mockUserManager.Object, _mockConfiguration.Object);
        }

        [Fact]
        public async Task RegisterAsync_ReturnsSuccess_WhenUserCreated()
        {
            // Arrange
            var registerDto = new RegisterDTO
            {
                Email = "test@example.com",
                Password = "Test@123",
                FullName = "Test User"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(registerDto.Email))
                .ReturnsAsync((ApplicationUser)null);

            _mockUserManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _userService.RegisterAsync(registerDto);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Usuário registrado com sucesso", result.Message);
        }

        [Fact]
        public async Task RegisterAsync_ReturnsFailure_WhenUserExists()
        {
            // Arrange
            var registerDto = new RegisterDTO
            {
                Email = "existing@example.com",
                Password = "Test@123",
                FullName = "Existing User"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(registerDto.Email))
                .ReturnsAsync(new ApplicationUser { Email = registerDto.Email });

            // Act
            var result = await _userService.RegisterAsync(registerDto);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Usuário já existe", result.Message);
        }

        [Fact]
        public async Task LoginAsync_ReturnsSuccess_WithToken_WhenCredentialsValid()
        {
            // Arrange
            var loginDto = new LoginDTO
            {
                Email = "test@example.com",
                Password = "Test@123"
            };

            var user = new ApplicationUser
            {
                Id = "test-user-id",
                Email = loginDto.Email,
                UserName = loginDto.Email,
                FullName = "Test User"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginDto.Email))
                .ReturnsAsync(user);

            _mockUserManager.Setup(x => x.CheckPasswordAsync(user, loginDto.Password))
                .ReturnsAsync(true);

            _mockUserManager.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string>());

            // Act
            var result = await _userService.LoginAsync(loginDto);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Login realizado com sucesso", result.Message);
            Assert.NotNull(result.Token);
            Assert.Equal(user.Email, result.Email);
            Assert.Equal(user.FullName, result.FullName);
        }

        [Fact]
        public async Task LoginAsync_ReturnsFailure_WhenUserNotFound()
        {
            // Arrange
            var loginDto = new LoginDTO
            {
                Email = "nonexistent@example.com",
                Password = "Test@123"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginDto.Email))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = await _userService.LoginAsync(loginDto);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Usuário não encontrado", result.Message);
        }

        [Fact]
        public async Task LoginAsync_ReturnsFailure_WhenPasswordInvalid()
        {
            // Arrange
            var loginDto = new LoginDTO
            {
                Email = "test@example.com",
                Password = "WrongPassword"
            };

            var user = new ApplicationUser
            {
                Email = loginDto.Email,
                UserName = loginDto.Email
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginDto.Email))
                .ReturnsAsync(user);

            _mockUserManager.Setup(x => x.CheckPasswordAsync(user, loginDto.Password))
                .ReturnsAsync(false);

            // Act
            var result = await _userService.LoginAsync(loginDto);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Senha inválida", result.Message);
        }
    }
}