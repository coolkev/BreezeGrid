module BreezeGrid {

    export class BreezeGrid<T> implements BreezeGridMethods<T> {

        public columns: KnockoutObservableArray<Column<T>>;

        public sortColumn = ko.observable<Column<T>>(null);
        public sortDesc = ko.observable(false);
        public totalCount = ko.observable(0);

        public rows = ko.observableArray<T>();

        public loading = ko.observable(true);
        public templates: { [index: string]: string; };

        public dataProvider: DataProvider;


        constructor(public options: GridOptions<T>) {

            initKoNumericExtender();

            //initialize plugins
            (options.plugins || []).forEach(p => {


                var plugin: BreezeGridPlugin<T> = typeof (p) == 'function' ? new p() : p;
                var original: BreezeGridMethods<T> = {};
                this.initPlugin(plugin, original);
                plugin.init(this, original);

                
            });


            options.columns.forEach(this.initColumn);

            this.sortColumn(options.columns[0]);

            this.columns = ko.observableArray(options.columns);

            this.templates = <any> this.getDefaultTemplates();

            this.dataProvider = options.dataProvider;

            
        }


        private initPlugin<T>(plugin: BreezeGridPlugin<T>, original: BreezeGridMethods<T>) {
            for (var p in plugin) {

                if (typeof (plugin[p]) == 'function') {
                    if (typeof (this[p]) == 'function') {
                        original[p] = this[p].bind(this);
                    }
                    this[p] = plugin[p].bind(plugin);
                }
            }

        }

        public initColumn(col: Column<T>) {

            if (!col.field && col.fieldName) {
                col.field = function(row) {
                    return row[this.fieldName];
                }
            } else if (col.field && !col.fieldName) {
                col.fieldName = BreezeGrid.getExpression(col.field);
            }

            if (typeof (col.width) == 'undefined') {
                col.width = null;
            }
            else if (typeof(col.width) == 'number') {
                col.width = <any>(col.width + 'px');
            }

            if (typeof (col.sortable) == 'undefined') {
                col.sortable = true;
            }

            if (!col.sortExpression) {
                col.sortExpression = col.fieldName;
            }

            if (!col.headerText) {
                col.headerText = col.fieldName;
            }
            if (col.viewTemplate) {
                //if (typeof (col.viewTemplate) == 'function') {
                  //  col.viewTemplate = new col.viewTemplate();
                //} else {
                    //col.viewTemplate = col.viewTemplate;
                //}
            } else {
                col.viewTemplate = ViewBuilder.Default;
            }

        }

        private static getExpression(func): string {

            var expr = func.toString();

            var myregexp = /return .*\.(\w+);?/;
            var match = myregexp.exec(expr);
            if (match != null) {
                return match[1];
            }
            return null;
        }

        public performSort(column: Column<T>) {
            if (this.sortColumn() == column)
                this.sortDesc(!this.sortDesc());
            else {
                this.sortColumn(column);
                this.sortDesc(false);
            }

            this.search();


        }

        public getCurrentView(column: Column<T>, row: T) {

            var value = ko.utils.unwrapObservable(column.field(row));
            var displayValue = column.formatter ? column.formatter(value, row) : value;

            var viewTemplate = column.viewTemplate;
            return viewTemplate(column, displayValue, row);
        }

        public search() {

            this.loading(true);

            var options = this.getQueryOptions();

            this.dataProvider.executeQuery(options, data => {

                this.searchComplete(data);

                this.rows(<any[]>data.results);

                this.setTotalCount(data);

                this.loading(false);

            });

        }

        public setTotalCount(data: breeze.QueryResult) {
            this.totalCount(data.results.length);
        }

        public getQueryOptions() {

            return {
                sortDesc: this.sortDesc(),
                sortColumn: this.sortColumn().sortExpression

            };
        }

        public searchComplete(data) {

        }

        public getDefaultTemplates() {

            return {
                headerRowTemplate: '<!-- ko template: {name: headerCellTemplateName, foreach: columns } --><!-- /ko -->',

                headerCellTemplate:
                "<th data-bind=\"text: headerText, style: {width: width}\"></th>",
                sortableHeaderCellTemplate:
                "<th data-bind=\"text: headerText, style: {width: width}, css: {sortable: sortable, sort: $parent.sortColumn()==$data, sortdesc: $parent.sortDesc()},click: $parent.performSort.bind($parent,$data)\"></th>",

                footerRowTemplate: '<td data-bind="attr: {colspan: columns().length }">' +
                '<div class="footcontainer" data-bind="template: \'footerTemplate\'"></div>' +
                '</td>',
                footerTemplate:
                '<div class="recordcount">' +
                '<span data-bind="text: totalCount"></span> ' +
                'Records' +
                '</div>'

            };
        }

        public getRowTemplate() {

            var rowbindings = '';
            
            if (this.options.rowCssClass) {
                rowbindings = "attr: {'class': $parent.options.rowCssClass($data) }, ";
            }
            
            if (this.options.rowBindings) {
                rowbindings += this.options.rowBindings;
            }

            var rowTemplate = '<tr data-bind="foreach: $parent.columns, ' + rowbindings + '">' +
                '<td class="cell" data-bind="breezeCell: $data, style: {width: width}"></td>' +
                '</tr>';

            return rowTemplate;
        }

        public headerCellTemplateName(column: Column<T>) {

            return (column.sortable ? 'sortableHeaderCellTemplate' : 'headerCellTemplate');
        }

        public initBindings(element: JQuery) {

        }
    }

    export interface BreezeGridMethods<T> {

        //overridable methods
        getCurrentView? (column: Column<T>, row: T);
        getDefaultTemplates? ();
        initBindings? (element: JQuery)
        getQueryOptions? (): QueryOptions;
        searchComplete? (data: breeze.QueryResult);
        initColumn? (col: Column<T>);
        setTotalCount? (data: breeze.QueryResult);
        getRowTemplate?: ()=>string;
    }

    export interface SelectOptions {
        options: any;
        optionsText?: string;
        optionsValue?: string;
        optionsCaption?: string;
    }

    export interface Column<TEntity> {

        field?: (entity: TEntity) => any;
        fieldName?: string;
        headerText?: string;
        cssClass?: (row?: TEntity)=> string;
        width?: number;
        sortable?: boolean;
        formatter?: (value: any, row?: TEntity) => string;
        editor?: any;
        sortExpression?: string;
        viewTemplate?: (col: Column<TEntity>, value, row: TEntity)=>any;
        //viewTemplateInstance?: Views.View<TEntity>;
    }

    export interface DataProvider {
        executeQuery(options: QueryOptions, callback: breeze.ExecuteQuerySuccessCallback): Q.Promise<breeze.QueryResult>;
        createEntity();
        saveChanges(row, saveOptions?: breeze.SaveOptions): Q.Promise<breeze.SaveResult>;

    }

    export class BreezeDataProvider implements DataProvider {

        constructor(public manager: breeze.EntityManager, public query: breeze.EntityQuery, private entityTypeName: string) {

        }

        public executeQuery(options: QueryOptions, callback: breeze.ExecuteQuerySuccessCallback) {

            var q = this.query;

            q = options.sortDesc ? q.orderByDesc(options.sortColumn) : q.orderBy(options.sortColumn);

            if (options.includeTotalCount)
                q = q.inlineCount();

            if (typeof (options.currentPage) != 'undefined') {
                var skip = (options.currentPage - 1) * options.pageSize;
                q = q.skip(skip).take(options.pageSize);
            }

            return this.manager.executeQuery(q, callback);


        }

        public createEntity() {
            return this.manager.createEntity(this.entityTypeName);
        }
        public saveChanges(row) {
            return this.manager.saveChanges(row);
        }

    }

    export interface GridOptions<TEntity> {

        dataProvider: DataProvider;
        plugins?: any[];
        columns: Column<TEntity>[];
        rowCssClass?: (row?: TEntity) => string;
        rowBindings?: string;
        tableCssClass?: string;
    }

    export interface QueryOptions {
        sortColumn: string;
        sortDesc: boolean;
        currentPage?: number;
        pageSize?: number;
        includeTotalCount?: boolean;
    }


    export class ViewBuilder<TEntity> {


        static Default<TEntity>(col: Column<TEntity>, value, row: TEntity) {
            return {
                div: {
                    text: value,
                    attr:
                    {
                        title: value
                    },
                    style: {
                        width: col.width
                    }
                }
            }
        }

        public Default(col: Column<TEntity>, value, row: TEntity) {
            return ViewBuilder.Default(col, value, row);
        }

        public ExtendDefault(builder: (row: TEntity) => any) {
            return (col: Column<TEntity>, value, row: TEntity) => {
                var result = ViewBuilder.Default(col, value, row);
                return extendDeep(result, builder(row));

            };
        }

    
        public Hyperlink(hrefBuilder: (row: TEntity) => string) {

            return (col: Column<TEntity>, value, row: TEntity) => {
                return {
                    a: {
                        text: value,
                        attr:
                        {
                            href: hrefBuilder(row),
                            title: value
                        },
                        style: {
                            width: col.width
                        }
                    }
                };
            };
        }

    }

    function extendDeep(target, source) {
        if (source) {
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {

                    if (typeof (source[prop]) == 'object') {
                        extendDeep(target[prop], source[prop]);
                    } else {
                        target[prop] = source[prop];
                    }
                }
            }
        }
        return target;
    }


    export module Editors {
        export interface Editor {
            getTemplate(col: Column<any>, row);
        }


        export class Text implements Editor {

            public getTemplate(col: Column<any>, row) {
                return {
                    input: {
                        value: col.field(row),
                        attr: { type: 'text', 'class': 'form-control' },
                        //style: { width: col.width + 'px' },
                        
                    }
                }
            }
        }

        export class Checkbox implements Editor {
            public getTemplate(col: Column<any>, row) {
                return {
                    input: {
                        checked: col.field(row),
                        attr: { type: 'checkbox' },
                    }
                }
            }
        }


        export class Select implements Editor {

            constructor(private valueGetter: (row) => any, private options: SelectOptions) {

            }
            public getTemplate(col: Column<any>, row) {

                var result = <any> {
                    select: {
                        attr: { 'class': 'form-control' },
                        value: this.valueGetter(row)
                    }
                };
                ko.utils.extend(result.select, this.options);
                return result;

            }

        }

        export class MultiSelect implements Editor {

            constructor(private valueGetter: (row) => any, private options: SelectOptions) {

            }
            public getTemplate(col: Column<any>, row) {

                var selectedOptions = this.valueGetter(row);

                if (ko.isObservable(selectedOptions)) {
                    
                    var computedOptions = ko.computed({
                        read: function () {
                            return selectedOptions().split(', ');
                        },
                        write: function (value: string[]) {

                            selectedOptions(value.join(', '));
                        },
                    });

                    var result = <any> {
                        select: {
                            attr: { 'class': 'form-control', multiple: 'multiple' },
                            selectedOptions: computedOptions

                        }
                    };
                    ko.utils.extend(result.select, this.options);
                    return result;

                }

            }

        }

    }

    export interface BreezeGridPlugin<T> extends BreezeGridMethods<T> {
        init(grid: BreezeGrid<T>, original: BreezeGridMethods<T>) : void;

    }


    function initKoNumericExtender() {

        if (!ko.extenders['numeric']) {
            //from http://knockoutjs.com/documentation/extenders.html

            ko.extenders['numeric'] = function(target, precision) {
                //create a writeable computed observable to intercept writes to our observable
                var result = ko.computed({
                    read: target, //always return the original observables value
                    write: function(newValue: number) {
                        var current = target(),
                            roundingMultiplier = Math.pow(10, precision),
                            newValueAsNum = isNaN(newValue) ? 0 : parseFloat(<any>+newValue),
                            valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

                        //only write if it changed
                        if (valueToWrite !== current) {
                            target(valueToWrite);
                        } else {
                            //if the rounded value is the same, but a different value was written, force a notification for the current field
                            if (newValueAsNum !== current) {
                                target.notifySubscribers(valueToWrite);
                            }
                        }
                    }
                }).extend({ notify: 'always' });

                //initialize with current value to make sure it is rounded appropriately
                result(target());

                //return the new computed observable
                return result;
            };
        }
    }

} 