var BreezeGrid;
(function (BreezeGrid) {
    (function (Plugins) {
        var Paging = (function () {
            function Paging(defaultPageSize) {
                if (typeof defaultPageSize === "undefined") { defaultPageSize = 20; }
                this.currentPage = ko.observable(1).extend({ numeric: 0 });
                this.currentPageChanging = false;
                this.pageSizeChanging = false;
                this.pageSize = ko.observable(defaultPageSize);
                this.pageSizes = [10, 20, 50, 100];
                if (defaultPageSize != 20) {
                    this.pageSizes.push(defaultPageSize);
                    this.pageSizes = this.pageSizes.sort(function (a, b) {
                        return a - b;
                    });
                }
            }
            Paging.prototype.init = function (grid, original) {
                var _this = this;
                this.grid = grid;
                this.original = original;

                this.pageCount = ko.computed(function () {
                    return Math.ceil(grid.totalCount() / _this.pageSize());
                });

                this.currentPage.subscribe(function () {
                    if (_this.grid.dataProvider) {
                        _this.currentPageChanging = true;
                        grid.search();
                        _this.currentPageChanging = false;
                    }
                }, this);

                this.pageSize.subscribe(function () {
                    if (_this.grid.dataProvider) {
                        _this.pageSizeChanging = true;
                        grid.search();
                        _this.pageSizeChanging = false;
                    }
                }, this);

                grid['paging'] = this;
            };

            Paging.prototype.getQueryOptions = function () {
                if (!this.currentPageChanging) {
                    this.currentPage(1);
                }

                var options = this.original.getQueryOptions();
                options.includeTotalCount = !this.currentPageChanging && !this.pageSizeChanging;
                options.currentPage = this.currentPage();
                options.pageSize = this.pageSize();

                return options;
            };

            Paging.prototype.getDefaultTemplates = function () {
                var templates = this.original.getDefaultTemplates();

                templates.footerTemplate = '<!-- ko template: "recordCountTemplate" --><!--/ko -->' + '<!-- ko template: {name: "pagerTemplate", data: paging } --><!--/ko -->' + '<!-- ko template: {name:"pageSizeTemplate", data: paging } --><!--/ko -->';
                templates.recordCountTemplate = '<div class="recordcount">' + '<span data-bind="text: totalCount"></span> ' + 'Records' + '</div>';
                templates.pagerTemplate = '<div class="pager" data-bind="css: { hidden: pageCount()<=1 }">' + '<a href="#" class="glyphicon glyphicon-fast-backward" data-bind="css: { disabled: currentPage()==1 }, click:function() { currentPage(1)}"></a> ' + '<a href="#" class="glyphicon glyphicon-backward" data-bind="css: { disabled: currentPage()==1 }, click: function() {currentPage(currentPage() > 1 ? currentPage()-1 : 1) }"></a> ' + '<span>' + 'Page ' + '<input type="text" class="currentpage" data-bind="value:currentPage" /> ' + 'of <span class="pagecount" data-bind="text: pageCount()"></span>' + '</span> ' + '<a href="#" class="glyphicon glyphicon-forward" data-bind="css: { disabled: currentPage()==pageCount() }, click: function() { currentPage(currentPage()<pageCount() ? currentPage()+1 : pageCount()) }"></a> ' + '<a href="#" class="glyphicon glyphicon-fast-forward" data-bind="css: { disabled: currentPage()==pageCount() }, click: function() { currentPage(pageCount()) }"></a> ' + '</div>';
                templates.pageSizeTemplate = '<div class="pagesize">' + 'Show: ' + '<select data-bind="options: pageSizes, value: pageSize"></select>' + '</div>';

                return templates;
            };
            Paging.prototype.setTotalCount = function (data) {
                if (data.inlineCount >= 0) {
                    this.grid.totalCount(data.inlineCount);
                }
            };
            return Paging;
        })();
        Plugins.Paging = Paging;
    })(BreezeGrid.Plugins || (BreezeGrid.Plugins = {}));
    var Plugins = BreezeGrid.Plugins;
})(BreezeGrid || (BreezeGrid = {}));
