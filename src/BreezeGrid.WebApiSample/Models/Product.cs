using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace BreezeGrid.WebApiSample.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        [Range(0.01,100000)]
        public decimal Price { get; set; }

        public DateTime DateAdded { get; set; }

    }
}