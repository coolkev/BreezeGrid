using System.Data.Entity;

namespace BreezeGrid.WebApiSample.Models
{
    public class SampleDbContext : DbContext
    {

        public DbSet<Product> Products { get; set; }
    }
}