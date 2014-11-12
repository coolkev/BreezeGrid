module BreezeGrid.Plugins {


    export class Paging<T> implements BreezeGridPlugin<T> {

        private grid: BreezeGrid<T>;

        private original: BreezeGridMethods<T>;

        public pageCount: KnockoutComputed<number>;
        public currentPage = ko.observable(1).extend({numeric:0});
        public pageSize: KnockoutObservable<number>;
        public pageSizes: number[];

        private currentPageChanging = false;
        private pageSizeChanging = false;
        constructor(defaultPageSize: number = 20) {

            this.pageSize = ko.observable(defaultPageSize);
            this.pageSizes = [10, 20, 50, 100];
            if (defaultPageSize != 20) {

                this.pageSizes.push(defaultPageSize);
                this.pageSizes = this.pageSizes.sort((a, b) => a - b);
            }
        }

        public init(grid: BreezeGrid<T>, original: BreezeGridMethods<T>): void {

            this.grid = grid;
            this.original = original;

            this.pageCount = ko.computed(() => {
                return Math.ceil(grid.totalCount() / this.pageSize());
            });


            this.currentPage.subscribe(() => {
                this.currentPageChanging = true;
                grid.search();
                this.currentPageChanging = false;

            }, this);

            this.pageSize.subscribe(() => {
                this.pageSizeChanging = true;
                grid.search();
                this.pageSizeChanging = false;
            }, this);

            grid['paging'] = this;
        }

        public getQueryOptions() {

            if (!this.currentPageChanging) {
                this.currentPage(1);
            }

            var options = this.original.getQueryOptions();
            options.includeTotalCount = !this.currentPageChanging && !this.pageSizeChanging;
            options.currentPage = this.currentPage();
            options.pageSize = this.pageSize();

            return options;
        }

        public getDefaultTemplates() {

            var templates = this.original.getDefaultTemplates();

            templates.footerTemplate = '<!-- ko template: "recordCountTemplate" --><!--/ko -->' +
            '<!-- ko template: {name: "pagerTemplate", data: paging } --><!--/ko -->' +
            '<!-- ko template: {name:"pageSizeTemplate", data: paging } --><!--/ko -->';
            templates.recordCountTemplate = '<div class="recordcount">' +
            '<span data-bind="text: totalCount"></span> ' +
            'Records' +
            '</div>';
            templates.pagerTemplate =
            '<div class="pager" data-bind="css: { hidden: pageCount()<=1 }">' +
            '<a href="#" class="glyphicon glyphicon-fast-backward" data-bind="css: { disabled: currentPage()==1 }, click:function() { currentPage(1)}"></a> ' +
            '<a href="#" class="glyphicon glyphicon-backward" data-bind="css: { disabled: currentPage()==1 }, click: function() {currentPage(currentPage() > 1 ? currentPage()-1 : 1) }"></a> ' +
            '<span>' +
            'Page ' +
            '<input type="text" class="currentpage" data-bind="value:currentPage" /> ' +
            'of <span class="pagecount" data-bind="text: pageCount()"></span>' +
            '</span> ' +
            '<a href="#" class="glyphicon glyphicon-forward" data-bind="css: { disabled: currentPage()==pageCount() }, click: function() { currentPage(currentPage()<pageCount() ? currentPage()+1 : pageCount()) }"></a> ' +
            '<a href="#" class="glyphicon glyphicon-fast-forward" data-bind="css: { disabled: currentPage()==pageCount() }, click: function() { currentPage(pageCount()) }"></a> ' +
            '</div>';
            templates.pageSizeTemplate =
            '<div class="pagesize">' +
            'Show: ' +
            '<select data-bind="options: pageSizes, value: pageSize"></select>' +
            '</div>';

            return templates;


        }
        public setTotalCount(data: breeze.QueryResult) {
            if (data.inlineCount>=0) {
                this.grid.totalCount(data.inlineCount);
            }
        }


    }
}
