module BreezeGridWebApiSample {

    export function init() {
        var manager = new breeze.EntityManager('/breeze/Products');

        var query = new breeze.EntityQuery().from("Products");

        var cols: BreezeGrid.Column<server.Product>[] = [
            { field: m => m.Name, width: 140, editor: BreezeGrid.Editors.Text },
            { field: m => m.Category, width: 140, headerText: 'Category', editor: BreezeGrid.Editors.Text  },
            { field: m => m.Price, width: 80, editor: BreezeGrid.Editors.Text },
            { field: m => m.DateAdded, width: 250, editor: BreezeGrid.Editors.Text }
        ];


        var dataProvider = new BreezeGrid.BreezeDataProvider(manager, query, 'Product');

        var viewModel = {
            grid: new BreezeGrid.BreezeGrid<server.Product>({
                dataProvider: dataProvider,
                columns: cols,
                plugins: [BreezeGrid.Plugins.Editing, BreezeGrid.Plugins.Paging]
            }),
            searchText: ko.observable(''),
            performSearch: function() {
                dataProvider.query = query.where('Name', 'contains', viewModel.searchText());
                viewModel.grid.search();

            }
        };


        viewModel.grid.search();


        ko.applyBindings(viewModel);

    }
}