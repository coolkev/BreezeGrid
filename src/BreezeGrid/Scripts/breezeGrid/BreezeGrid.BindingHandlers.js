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
