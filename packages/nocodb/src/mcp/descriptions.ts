export const whereDescription = `使用星澜语法筛选记录：(字段,操作符,值)

OPERATORS (操作符)：
- 相等: eq, neq, is, isnot
- 比较: gt, lt, gte, lte  
- 文本: like, nlike, in
- 空值: null, notnull, blank, notblank, empty, notempty
- 布尔值: checked, notchecked
- 数组: allof, anyof, nallof, nanyof
- 范围: btw, nbtw
- 日期范围: isWithin (子操作符: pastWeek, pastMonth, pastYear, nextWeek, nextMonth, nextYear, pastNumberOfDays, nextNumberOfDays)

LOGICAL OPERATIONS (逻辑运算)：
- AND (与): (filter1)(filter2) 或 (filter1)~and(filter2)
- OR (或): (filter1)~or(filter2)  
- NOT (非): ~not(filter)
- 分组: 使用括号确定优先级

EXAMPLES (示例)：
基础: (name,eq,John), (age,gt,25), (status,in,active,pending)
文本: (title,like,%search%), (email,neq,'')
空值: (notes,blank), (id,notnull)
日期: (created_at,eq,today), (due_date,isWithin,pastWeek), (event_date,btw,2024-01-01,2024-12-31)
逻辑: (name,eq,John)~and(age,gt,18), ((dept,eq,eng)~or(dept,eq,sales))~and(active,eq,true)
特殊: (field,eq,NULL), (field,eq,''), ('field with spaces',eq,value)

TIPS (提示)：在 'like' 中使用 % 作为通配符，用引号包裹带空格的值，使用 ~and/~or 组合过滤器
`;

export const aggregationDescription = `聚合类型：
       • 数值型：sum (求和), min (最小), max (最大), avg (平均), median (中位数), std_dev (标准差), range (范围) (适用于数字)
       • 通用型：count (计数), count_empty (空值计数), count_filled (非空计数), count_unique (唯一值计数), percent_empty (空值百分比), percent_filled (非空百分比), percent_unique (唯一值百分比) (适用于所有类型)
       • 布尔型：checked (已勾选), unchecked (未勾选), percent_checked (已勾选百分比), percent_unchecked (未勾选百分比) (适用于复选框)
       • 日期型：earliest_date (最早日期), latest_date (最晚日期), date_range (日期范围), month_range (月份范围) (适用于日期)`;
