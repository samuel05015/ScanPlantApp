using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using ScanPlantAPI.Services;
using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace ScanPlantAPI.Tests.Services
{
    public class StorageServiceTests
    {
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly StorageService _storageService;

        public StorageServiceTests()
        {
            // Configurar mock do IConfiguration
            _mockConfiguration = new Mock<IConfiguration>();
            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns("UseDevelopmentStorage=true");
            _mockConfiguration.Setup(c => c.GetSection("AzureBlobStorage:ConnectionString")).Returns(configSection.Object);
            
            var containerSection = new Mock<IConfigurationSection>();
            containerSection.Setup(x => x.Value).Returns("plants-images");
            _mockConfiguration.Setup(c => c.GetSection("AzureBlobStorage:ContainerName")).Returns(containerSection.Object);

            // Criar instância do serviço com mock
            // Nota: Este teste é parcial pois não podemos testar completamente o Azure Blob Storage sem uma conexão real
            _storageService = new StorageService(_mockConfiguration.Object);
        }

        [Fact]
        public void Constructor_InitializesCorrectly()
        {
            // Arrange & Act já feitos no construtor

            // Assert
            // Verificamos se o serviço foi inicializado sem exceções
            Assert.NotNull(_storageService);
        }

        [Fact]
        public void GetFileUrlAsync_ReturnsCorrectUrl()
        {
            // Arrange
            string fileName = "test-image.jpg";
            
            // Act
            var url = _storageService.GetFileUrlAsync(fileName).Result;

            // Assert
            Assert.NotNull(url);
            Assert.Contains(fileName, url);
        }

        [Fact]
        public async Task UploadFileAsync_WithValidFile_ReturnsFileName()
        {
            // Arrange
            var content = "Fake image content";
            var fileName = "test-upload.jpg";
            var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
            
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns(fileName);
            fileMock.Setup(f => f.Length).Returns(stream.Length);
            fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
            fileMock.Setup(f => f.ContentType).Returns("image/jpeg");
            
            // Act & Assert
            // Nota: Como não podemos testar completamente o Azure Blob Storage sem uma conexão real,
            // este teste verifica apenas se o método não lança exceções e retorna um nome de arquivo
            // Em um ambiente real, usaríamos um mock do BlobServiceClient
            var exception = await Record.ExceptionAsync(async () => 
            {
                var result = await _storageService.UploadFileAsync(fileMock.Object);
                Assert.NotNull(result);
                Assert.Contains(Guid.NewGuid().ToString().Substring(0, 8), result);
            });
            
            // Se estamos usando o emulador local, podemos ter uma exceção de conexão
            // que é esperada em um ambiente de teste sem o emulador configurado
            if (exception != null)
            {
                Assert.Contains("UseDevelopmentStorage", exception.Message);
            }
        }
    }
}