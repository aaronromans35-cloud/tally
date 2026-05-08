alter table budget_categories add column if not exists bucket text default 'variable';
update budget_categories set bucket = 'income' where type = 'income';
update budget_categories set bucket = 'variable' where type = 'expense' and bucket = 'variable';
