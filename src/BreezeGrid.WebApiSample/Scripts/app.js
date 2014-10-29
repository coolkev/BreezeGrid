var BreezeGridWebApiSample;
(function (BreezeGridWebApiSample) {
    function init() {
        var manager = new breeze.EntityManager('/breeze/Products');

        var query = new breeze.EntityQuery().from("Products");

        var cols = [
            { field: function (m) {
                    return m.Name;
                }, width: 140, editor: BreezeGrid.Editors.Text },
            { field: function (m) {
                    return m.Category;
                }, width: 140, headerText: 'Category', editor: BreezeGrid.Editors.Text },
            { field: function (m) {
                    return m.Price;
                }, width: 80, editor: BreezeGrid.Editors.Text }
        ];

        var dataProvider = new BreezeGrid.BreezeDataProvider(manager, query, 'Product');

        var viewModel = {
            grid: new BreezeGrid.BreezeGrid({
                dataProvider: dataProvider,
                columns: cols,
                plugins: [BreezeGrid.Plugins.Editing]
            })
        };

        viewModel.grid.search();

        ko.applyBindings(viewModel);
    }
    BreezeGridWebApiSample.init = init;
})(BreezeGridWebApiSample || (BreezeGridWebApiSample = {}));
