﻿module BreezeGrid {

    class StringTemplateSource implements KnockoutTemplateSourcesDomElement {

        constructor(private templateName, private templates) {

        }

        public data(key);
        public data(key, value?) {
            this.templates._data = this.templates._data || {};
            this.templates._data[this.templateName] = this.templates._data[this.templateName] || {};

            if (arguments.length === 1) {
                return this.templates._data[this.templateName][key];
            }

            this.templates._data[this.templateName][key] = value;
        }

        public text();
        public text(value?) {
            if (arguments.length === 0) {
                return this.templates[this.templateName];
            }
            this.templates[this.templateName] = value;
        }
    }

    //modify an existing templateEngine to work with string templates
    //function createStringTemplateEngine(templateEngine: KnockoutTemplateEngine) {


    //    templateEngine.renderTemplate = function (template, bindingContext, options, templateDocument) {
    //        //var templateSource = this['makeTemplateSource'](template, templateDocument);
    //        return this['renderTemplateSource'](templateSource, bindingContext, options);
    //    };


    //    //var origmakeTemplateSource = templateEngine.makeTemplateSource;
    //    //templateEngine.makeTemplateSource = function(templateName) {

    //    //    if (templates[templateName]) {
    //    //        return new StringTemplateSource(templateName, templates);
    //    //    }

    //    //    return origmakeTemplateSource(templateName);
    //    //};
    //    return templateEngine;
    //}

    var templateEngine: KnockoutTemplateEngine;
    ko.bindingHandlers['breezeGrid'] = <KnockoutBindingHandler> {
        init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
            var gridModel: BreezeGrid<any> = valueAccessor();
            var elem = $(element);

            var templates = gridModel.templates;

            //var cellTemplateTypes = ['headerCellTemplate', 'cellViewTemplate', 'cellEditTemplate'];

            //gridModel.columns().forEach((c, i) => {

            //    cellTemplateTypes.forEach(t => {
            //        if (c[t]) {
            //            templates[t + i] = c[t];
            //        }
            //    });
            //});
            if (!templateEngine) {
                templateEngine = <KnockoutTemplateEngine> new ko.nativeTemplateEngine();
                templateEngine.renderTemplate = function (template, bindingContext, options, templateDocument) {
                    
                    //if (!bindingContext.$data['templateSource']) {
                      //  bindingContext.$data['templateSource'] = new StringTemplateSource()
                    //}
                    var templateSource = new StringTemplateSource(template, templates);

                    //var templateSource = this['makeTemplateSource'](template, templateDocument);
                    return this['renderTemplateSource'](templateSource, bindingContext, options);
                };

                ko.setTemplateEngine(templateEngine);
            }

            //var gridElem = $(gridModel.templates['gridTemplate']);

            var gridElem = $('<div class="ajaxloader"></div>' +
                '<table class="table table-condensed ' + (gridModel.options.tableCssClass || '') + '">' +
                '<thead>' +
                '<tr data-bind="template: \'headerRowTemplate\'">' +
                '</tr>' +
                '</thead>' +
                '<tbody data-bind="foreach: rows">' + gridModel.getRowTemplate() + 
                '</tbody>' +
                '<tfoot>' +
                '<tr data-bind="template: \'footerRowTemplate\'">' +
                '</tfoot>' +
                '</table>');

            //set the right styling on the container
            elem.addClass("breezeGrid loading ");

            gridModel.initBindings(elem);

            elem.append(gridElem);


            gridModel.loading.subscribe(loading => {
                elem.toggleClass('loading', loading);
            });


            //var innerBindingContext = bindingContext.extend(valueAccessor);
            //ko.applyBindingsToDescendants(innerBindingContext, element);
            var childBindingContext = bindingContext.createChildContext(valueAccessor);
            ko.applyBindingsToDescendants(childBindingContext, element);

            elem.show();

            return { controlsDescendantBindings: true };
        }
    };


    ko.bindingHandlers['breezeCell'] = <KnockoutBindingHandler> {
        update: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) => {
            var column: Column<any> = valueAccessor();
            var row = bindingContext.$parent;
            var td = $(element);
            var grid = <BreezeGrid.BreezeGrid<any>> bindingContext.$parents[1];

            var elem: JQuery;

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

}