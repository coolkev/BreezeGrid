using System;
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
                    new Product {Id = 1, Name = "Tomato Soup", Category = "Groceries", Price = 1, DateAdded = DateTime.Now.AddMinutes(-10)},
                    new Product {Id = 2, Name = "Yo-yo", Category = "Toys", Price = 3.75M, DateAdded = DateTime.Now.AddMinutes(-5)},
                    new Product {Id = 3, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 4, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 5, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 6, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 7, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 8, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 9, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 10, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 11, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 12, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 13, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 14, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 15, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 16, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 17, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 18, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 19, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 20, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 21, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
                    new Product {Id = 22, Name = "Hammer", Category = "Hardware", Price = 16.99M, DateAdded = DateTime.Now.AddMinutes(-1)},
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
