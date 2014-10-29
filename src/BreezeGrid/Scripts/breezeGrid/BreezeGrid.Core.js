var BreezeGrid;
(function (_BreezeGrid) {
    var BreezeGrid = (function () {
        function BreezeGrid(options) {
            var _this = this;
            this.options = options;
            this.sortColumn = ko.observable(null);
            this.sortDesc = ko.observable(false);
            this.totalCount = ko.observable(0);
            this.rows = ko.observableArray();
            this.loading = ko.observable(true);
            //initialize plugins
            (options.plugins || []).forEach(function (p) {
                var plugin = typeof (p) == 'function' ? new p() : p;
                var original = {};
                _this.initPlugin(plugin, original);
                plugin.init(_this, original);
            });

            options.columns.forEach(this.initColumn);

            this.sortColumn(options.columns[0]);

            this.columns = ko.observableArray(options.columns);

            this.templates = this.getDefaultTemplates();

            this.dataProvider = options.dataProvider;
        }
        BreezeGrid.prototype.initPlugin = function (plugin, original) {
            for (var p in plugin) {
                if (typeof (plugin[p]) == 'function') {
                    if (typeof (this[p]) == 'function') {
                        original[p] = this[p].bind(this);
                    }
                    this[p] = plugin[p].bind(plugin);
                }
            }
        };

        BreezeGrid.prototype.initColumn = function (col) {
            if (!col.field && col.fieldName) {
                col.field = function (row) {
                    return row[this.fieldName];
                };
            } else if (col.field && !col.fieldName) {
                col.fieldName = BreezeGrid.getExpression(col.field);
            }

            if (typeof (col.width) == 'undefined') {
                col.width = null;
            } else if (typeof (col.width) == 'number') {
                col.width = (col.width + 'px');
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
        };

        BreezeGrid.getExpression = function (func) {
            var expr = func.toString();

            var myregexp = /return .*\.(\w+);?/;
            var match = myregexp.exec(expr);
            if (match != null) {
                return match[1];
            }
            return null;
        };

        BreezeGrid.prototype.performSort = function (column) {
            if (this.sortColumn() == column)
                this.sortDesc(!this.sortDesc());
            else {
                this.sortColumn(column);
                this.sortDesc(false);
            }

            this.search();
        };

        BreezeGrid.prototype.getCurrentView = function (column, row) {
            var value = ko.utils.unwrapObservable(column.field(row));
            var displayValue = column.formatter ? column.formatter(value, row) : value;

            var viewTemplate = column.viewTemplate;
            return viewTemplate(column, displayValue, row);
        };

        BreezeGrid.prototype.search = function () {
            var _this = this;
            this.loading(true);

            var options = this.getQueryOptions();

            this.dataProvider.executeQuery(options, function (data) {
                _this.searchComplete(data);

                _this.rows(data.results);

                _this.setTotalCount(data);

                _this.loading(false);
            });
        };

        BreezeGrid.prototype.setTotalCount = function (data) {
            this.totalCount(data.results.length);
        };

        BreezeGrid.prototype.getQueryOptions = function () {
            return {
                sortDesc: this.sortDesc(),
                sortColumn: this.sortColumn().sortExpression
            };
        };

        BreezeGrid.prototype.searchComplete = function (data) {
        };

        BreezeGrid.prototype.getDefaultTemplates = function () {
            return {
                headerRowTemplate: '<!-- ko template: {name: headerCellTemplateName, foreach: columns } --><!-- /ko -->',
                headerCellTemplate: "<th data-bind=\"text: headerText, style: {width: width}\"></th>",
                sortableHeaderCellTemplate: "<th data-bind=\"text: headerText, style: {width: width}, css: {sortable: sortable, sort: $parent.sortColumn()==$data, sortdesc: $parent.sortDesc()},click: $parent.performSort.bind($parent,$data)\"></th>",
                footerRowTemplate: '<td data-bind="attr: {colspan: columns().length }">' + '<div class="footcontainer" data-bind="template: \'footerTemplate\'"></div>' + '</td>',
                footerTemplate: '<div class="recordcount">' + '<span data-bind="text: totalCount"></span> ' + 'Records' + '</div>'
            };
        };

        BreezeGrid.prototype.getRowTemplate = function () {
            var rowbindings = '';

            if (this.options.rowCssClass) {
                rowbindings = "attr: {'class': $parent.options.rowCssClass($data) }, ";
            }

            if (this.options.rowBindings) {
                rowbindings += this.options.rowBindings;
            }

            var rowTemplate = '<tr data-bind="foreach: $parent.columns, ' + rowbindings + '">' + '<td class="cell" data-bind="breezeCell: $data, style: {width: width}"></td>' + '</tr>';

            return rowTemplate;
        };

        BreezeGrid.prototype.headerCellTemplateName = function (column) {
            return (column.sortable ? 'sortableHeaderCellTemplate' : 'headerCellTemplate');
        };

        BreezeGrid.prototype.initBindings = function (element) {
        };
        return BreezeGrid;
    })();
    _BreezeGrid.BreezeGrid = BreezeGrid;

    var BreezeDataProvider = (function () {
        function BreezeDataProvider(manager, query, entityTypeName) {
            this.manager = manager;
            this.query = query;
            this.entityTypeName = entityTypeName;
        }
        BreezeDataProvider.prototype.executeQuery = function (options, callback) {
            var q = this.query;

            q = options.sortDesc ? q.orderByDesc(options.sortColumn) : q.orderBy(options.sortColumn);

            if (options.includeTotalCount)
                q = q.inlineCount();

            if (typeof (options.currentPage) != 'undefined') {
                var skip = (options.currentPage - 1) * options.pageSize;
                q = q.skip(skip).take(options.pageSize);
            }

            return this.manager.executeQuery(q, callback);
        };

        BreezeDataProvider.prototype.createEntity = function () {
            return this.manager.createEntity(this.entityTypeName);
        };
        BreezeDataProvider.prototype.saveChanges = function (row) {
            return this.manager.saveChanges(row);
        };
        return BreezeDataProvider;
    })();
    _BreezeGrid.BreezeDataProvider = BreezeDataProvider;

    var ViewBuilder = (function () {
        function ViewBuilder() {
        }
        ViewBuilder.Default = function (col, value, row) {
            return {
                div: {
                    text: value,
                    attr: {
                        title: value
                    },
                    style: {
                        width: col.width
                    }
                }
            };
        };

        ViewBuilder.prototype.Default = function (col, value, row) {
            return ViewBuilder.Default(col, value, row);
        };

        ViewBuilder.prototype.ExtendDefault = function (builder) {
            return function (col, value, row) {
                var result = ViewBuilder.Default(col, value, row);
                return extendDeep(result, builder(row));
            };
        };

        ViewBuilder.prototype.Hyperlink = function (hrefBuilder) {
            return function (col, value, row) {
                return {
                    a: {
                        text: value,
                        attr: {
                            href: hrefBuilder(row),
                            title: value
                        },
                        style: {
                            width: col.width
                        }
                    }
                };
            };
        };
        return ViewBuilder;
    })();
    _BreezeGrid.ViewBuilder = ViewBuilder;

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

    (function (Editors) {
        var Text = (function () {
            function Text() {
            }
            Text.prototype.getTemplate = function (col, row) {
                return {
                    input: {
                        value: col.field(row),
                        attr: { type: 'text', 'class': 'form-control' }
                    }
                };
            };
            return Text;
        })();
        Editors.Text = Text;

        var Checkbox = (function () {
            function Checkbox() {
            }
            Checkbox.prototype.getTemplate = function (col, row) {
                return {
                    input: {
                        checked: col.field(row),
                        attr: { type: 'checkbox' }
                    }
                };
            };
            return Checkbox;
        })();
        Editors.Checkbox = Checkbox;

        var Select = (function () {
            function Select(valueGetter, options) {
                this.valueGetter = valueGetter;
                this.options = options;
            }
            Select.prototype.getTemplate = function (col, row) {
                var result = {
                    select: {
                        attr: { 'class': 'form-control' },
                        value: this.valueGetter(row)
                    }
                };
                ko.utils.extend(result.select, this.options);
                return result;
            };
            return Select;
        })();
        Editors.Select = Select;

        var MultiSelect = (function () {
            function MultiSelect(valueGetter, options) {
                this.valueGetter = valueGetter;
                this.options = options;
            }
            MultiSelect.prototype.getTemplate = function (col, row) {
                var selectedOptions = this.valueGetter(row);

                if (ko.isObservable(selectedOptions)) {
                    var computedOptions = ko.computed({
                        read: function () {
                            return selectedOptions().split(', ');
                        },
                        write: function (value) {
                            selectedOptions(value.join(', '));
                        }
                    });

                    var result = {
                        select: {
                            attr: { 'class': 'form-control', multiple: 'multiple' },
                            selectedOptions: computedOptions
                        }
                    };
                    ko.utils.extend(result.select, this.options);
                    return result;
                }
            };
            return MultiSelect;
        })();
        Editors.MultiSelect = MultiSelect;
    })(_BreezeGrid.Editors || (_BreezeGrid.Editors = {}));
    var Editors = _BreezeGrid.Editors;
})(BreezeGrid || (BreezeGrid = {}));
