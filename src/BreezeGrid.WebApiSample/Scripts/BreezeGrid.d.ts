declare module BreezeGrid {
    class BreezeGrid<T> {
        constructor(options: GridOptions<T>);
        columns: KnockoutObservableArray<ColumnBase>;

        sortColumn: KnockoutObservable<ColumnBase>;
        sortDesc: KnockoutObservable<boolean>;
        totalCount: KnockoutObservable<number>;

        rows: KnockoutObservableArray<T>;
        paging: Paging;

        loading: KnockoutObservable<boolean>;
        templates: { [index: string]: string; };
        search();
    }


    interface DataProvider {
        executeQuery(options: QueryOptions, callback: breeze.ExecuteQuerySuccessCallback): Q.Promise<breeze.QueryResult>;
        createEntity();
        saveChanges(row, saveOptions?: breeze.SaveOptions): Q.Promise<breeze.SaveResult>;

    }

    class BreezeDataProvider implements DataProvider {

        //public query: breeze.EntityQuery;
        //constructor(manager: breeze.EntityManager, query: breeze.EntityQuery, entityTypeName: string);
        //constructor(manager: breeze.EntityManager, query: KnockoutComputed<breeze.EntityQuery>, entityTypeName: string);
        constructor(manager: breeze.EntityManager, query: breeze.EntityQuery, entityTypeName: string);

        executeQuery(options: QueryOptions, callback: breeze.ExecuteQuerySuccessCallback): Q.Promise<breeze.QueryResult>;

        createEntity();
        public saveChanges(row): Q.Promise<breeze.SaveResult>;

    }

    interface GridOptions<TEntity> {

        dataProvider: DataProvider;
        plugins?: any[];
        columns: Column<TEntity>[];
        rowCssClass?: (row?: TEntity) => string;
        rowBindings?: string;
        tableCssClass?: string;
    }

    interface QueryOptions {
        sortColumn: string;
        sortDesc: boolean;
        currentPage?: number;
        pageSize?: number;
        includeTotalCount?: boolean;
    }


    interface Paging {
        pageCount: KnockoutComputed<number>;
        currentPage: KnockoutObservable<number>;
        pageSize: KnockoutObservable<number>;
        pageSizes: number[];
    }
    
    interface ColumnBase {

        sortable?: boolean;
        sortExpression?: string;

    }
    interface Column<TEntity> extends ColumnBase {

        field?: (a: TEntity) => any;

    }


    module Editors {
        class Editor {
            getTemplate(col: Column<any>, row);
        }


        class Text extends Editor {

        }

        class Checkbox extends Editor {

        }

        class Select extends Editor {

        }

        class MultiSelect extends Editor {

        }
    }


    module Plugins {

        class Editing {

        }

        class Paging {

        }

    }
}