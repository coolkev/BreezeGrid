using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using Breeze.ContextProvider;
using Breeze.ContextProvider.EF6;
using Breeze.WebApi2;
using BreezeGrid.WebApiSample.Models;
using Newtonsoft.Json.Linq;

namespace BreezeGrid.WebApiSample.Controllers
{
    [BreezeController]
    public class ProductsController : ApiController
    {
        private readonly EFContextProvider<SampleDbContext> _contextProvider;

        public ProductsController()
        {

            _contextProvider = new EFContextProvider<SampleDbContext>();

            // seed sample database
            if (!_contextProvider.Context.Products.Any())
            {
                Product[] products = new Product[]
                {
                    new Product {Id = 1, Name = "Tomato Soup", Category = "Groceries", Price = 1},
                    new Product {Id = 2, Name = "Yo-yo", Category = "Toys", Price = 3.75M},
                    new Product {Id = 3, Name = "Hammer", Category = "Hardware", Price = 16.99M}
                };

                _contextProvider.Context.Products.AddRange(products);
                _contextProvider.Context.SaveChanges();
            }

        }

        [HttpGet]
        public string Metadata()
        {
            return _contextProvider.Metadata();
        }
 
        [HttpGet]
        public IQueryable<Product> Products()
        {

            return _contextProvider.Context.Products;
        }

        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }
    }

    
}
