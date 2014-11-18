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
            initKoNumericExtender();

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

    function initKoNumericExtender() {
        if (!ko.extenders['numeric']) {
            //from http://knockoutjs.com/documentation/extenders.html
            ko.extenders['numeric'] = function (target, precision) {
                //create a writeable computed observable to intercept writes to our observable
                var result = ko.computed({
                    read: target,
                    write: function (newValue) {
                        var current = target(), roundingMultiplier = Math.pow(10, precision), newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue), valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

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
})(BreezeGrid || (BreezeGrid = {}));

var BreezeGrid;
(function (BreezeGrid) {
    var StringTemplateSource = (function () {
        function StringTemplateSource(templateName, templates) {
            this.templateName = templateName;
            this.templates = templates;
        }
        StringTemplateSource.prototype.data = function (key, value) {
            this.templates._data = this.templates._data || {};
            this.templates._data[this.templateName] = this.templates._data[this.templateName] || {};

            if (arguments.length === 1) {
                return this.templates._data[this.templateName][key];
            }

            this.templates._data[this.templateName][key] = value;
        };

        StringTemplateSource.prototype.text = function (value) {
            if (arguments.length === 0) {
                return this.templates[this.templateName];
            }
            this.templates[this.templateName] = value;
        };
        return StringTemplateSource;
    })();

    var templateEngine;
    ko.bindingHandlers['breezeGrid'] = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var gridModel = valueAccessor();
            var elem = $(element);

            var templates = gridModel.templates;

            if (!templateEngine) {
                templateEngine = new ko.nativeTemplateEngine();
                templateEngine.renderTemplate = function (template, bindingContext, options, templateDocument) {
                    var templateSource = new StringTemplateSource(template, templates);

                    return this['renderTemplateSource'](templateSource, bindingContext, options);
                };

                ko.setTemplateEngine(templateEngine);
            }

            var gridElem = $('<div class="ajaxloader"></div>' + '<table class="table table-condensed ' + (gridModel.options.tableCssClass || '') + '">' + '<thead>' + '<tr data-bind="template: \'headerRowTemplate\'">' + '</tr>' + '</thead>' + '<tbody data-bind="foreach: rows">' + gridModel.getRowTemplate() + '</tbody>' + '<tfoot>' + '<tr data-bind="template: \'footerRowTemplate\'">' + '</tfoot>' + '</table>');

            //set the right styling on the container
            elem.addClass("breezeGrid loading ");

            gridModel.initBindings(elem);

            elem.append(gridElem);

            gridModel.loading.subscribe(function (loading) {
                elem.toggleClass('loading', loading);
            });

            var childBindingContext = bindingContext.createChildContext(valueAccessor);
            ko.applyBindingsToDescendants(childBindingContext, element);

            elem.show();

            return { controlsDescendantBindings: true };
        }
    };

    ko.bindingHandlers['breezeCell'] = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var column = valueAccessor();
            var row = bindingContext.$parent;
            var td = $(element);
            var grid = bindingContext.$parents[1];

            var elem;

            td.empty();

            if (column.cssClass) {
                td.attr('class', 'cell ' + column.cssClass(row));
            }
            var view = grid.getCurrentView(column, row);

            for (var tag in view) {
                if (view.hasOwnProperty(tag)) {
                    elem = $('<' + tag + '/>');
                    td.append(elem);

                    var bindings = view[tag];
                    ko.applyBindingsToNode(elem[0], bindings, row);
                }
            }

            return { controlsDescendantBindings: true };
        }
    };
})(BreezeGrid || (BreezeGrid = {}));

var BreezeGrid;
(function (BreezeGrid) {
    (function (Plugins) {
        var Editing = (function () {
            function Editing() {
            }
            Editing.prototype.init = function (grid, original) {
                this.grid = grid;
                this.original = original;
            };

            Editing.prototype.getCurrentView = function (column, row) {
                if (row.editing() && column.editor) {
                    return column.editorInstance.getTemplate(column, row);
                }
                return this.original.getCurrentView(column, row);
            };

            Editing.prototype.initColumn = function (col) {
                this.original.initColumn(col);

                if (col.editor) {
                    if (typeof (col.editor) == 'function') {
                        col.editorInstance = new col.editor();
                    } else {
                        col.editorInstance = col.editor;
                    }
                }
            };

            Editing.prototype.addNew = function () {
                var entity = this.grid.dataProvider.createEntity();
                entity.editing = ko.observable(true);
                this.grid.rows.unshift(entity);
            };

            Editing.prototype.editRow = function (row) {
                row.editing(true);
                return true;
            };

            Editing.prototype.cancelEditRow = function (row) {
                var entity = row;
                if (entity.entityAspect.entityState == breeze.EntityState.Added) {
                    this.grid.rows.remove(row);
                } else {
                    entity.entityAspect.rejectChanges();
                    row.editing(false);
                }
            };

            Editing.prototype.saveRow = function (row) {
                this.grid.dataProvider.saveChanges([row]).then(function (saveResult) {
                    row.editing(false);
                }).fail(function (r) {
                    alert(r.entityErrors.map(function (m) {
                        return m.errorMessage;
                    }).join(','));
                });
            };

            Editing.prototype.deleteRow = function (row) {
                var _this = this;
                if ($('#dialog-delete').length == 0) {
                    $('body').append(this.getDeleteDialogTemplate());
                }

                $('#dialog-delete .btn-primary').one('click', function (e) {
                    row.entityAspect.setDeleted();

                    _this.grid.dataProvider.saveChanges([row]).then(function (saveResult) {
                        $('#dialog-delete').modal('hide');
                        _this.grid.rows.remove(row);
                    }).fail(function (r) {
                        $('#dialog-delete').modal('hide');
                        alert(r);
                    });
                });

                $('#dialog-delete').on('hide.bs.modal', function (e) {
                    $('#dialog-delete .btn-primary').unbind('click');
                }).modal();
            };

            Editing.prototype.getDeleteDialogTemplate = function () {
                return '<div class="modal fade" id="dialog-delete"><div class="modal-dialog"><div class="modal-content">' + '<div class="modal-header">' + '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>' + '<h4 class="modal-title">Confirm Delete</h4>' + '</div>' + '<div class="modal-body">' + '<p>Are you sure you want to delete this record?</p>' + '</div>' + '<div class="modal-footer">' + '<button type="button" class="btn btn-primary">Yes</button>' + '<button type="button" class="btn btn-default" data-dismiss="modal">No</button>' + '</div>' + '</div><!-- /.modal-content --></div><!-- /.modal-dialog --></div><!-- /.modal -->';
            };

            Editing.prototype.getDefaultTemplates = function () {
                var templates = this.original.getDefaultTemplates();

                templates.headerRowTemplate = '<th class="icons"></th><!-- ko template: {name: headerCellTemplateName, foreach: columns } --><!-- /ko -->';

                templates['viewIconsTemplate'] = '<button type="button" class="btn btn-primary btn-xs edit" title="Edit" data-bind="click: $parent.editRow.bind($parent)"><span class="glyphicon glyphicon-pencil"></span></button>' + '<button type="button" class="btn btn-danger btn-xs delete" title="Delete" data-bind="click: $parent.deleteRow.bind($parent)"><span class="glyphicon glyphicon-remove"></span></button>';

                templates['editIconsTemplate'] = '<button type="button" class="btn btn-success btn-xs" title="Save Changes" data-bind="click: $parent.saveRow.bind($parent)"><span class="glyphicon glyphicon-ok"></span></button>' + '<button type="button" class="btn btn-warning btn-xs" title="Cancel Edit" data-bind="click: $parent.cancelEditRow.bind($parent)"><span class="glyphicon glyphicon-thumbs-down"></span></button>';

                templates['footerRowTemplate'] = '<td class="icons"></td>' + templates['footerRowTemplate'];
                return templates;
            };

            Editing.prototype.getRowTemplate = function () {
                var rowbindings = '';

                if (this.grid.options.rowCssClass) {
                    rowbindings = "attr: {'class': $parent.options.rowCssClass($data) }, ";
                }

                if (this.grid.options.rowBindings) {
                    rowbindings += this.grid.options.rowBindings;
                }

                var rowTemplate = '<tr data-bind="' + rowbindings + '"><td class="icons" data-bind="template: editing() ? \'editIconsTemplate\' : \'viewIconsTemplate\'"></td>' + '<!-- ko foreach: $parent.columns  -->' + '<td class="cell" data-bind="breezeCell: $data, style: {width: width}"></td>' + '<!-- /ko --></tr>';

                return rowTemplate;
            };

            Editing.prototype.searchComplete = function (data) {
                data.results.forEach(function (r) {
                    return r.editing = r.editing || ko.observable(false);
                });

                this.original.searchComplete(data);
            };

            Editing.prototype.initBindings = function (element) {
                element.addClass("editable");
            };
            return Editing;
        })();
        Plugins.Editing = Editing;
    })(BreezeGrid.Plugins || (BreezeGrid.Plugins = {}));
    var Plugins = BreezeGrid.Plugins;
})(BreezeGrid || (BreezeGrid = {}));

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

