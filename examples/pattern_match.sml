fun length xs =
    case xs of
        [] => 0
        | x::rest => 1 + length rest

val lengthResult = length [1, 2, 3, 4, 5]

fun isEmpty xs =
    case xs of
        [] => true
        | _ => false

val isEmptyResult1 = isEmpty []
val isEmptyResult2 = isEmpty [1, 2]

fun map xs mapper =
    case xs of
        x::rest => mapper x :: map rest mapper
        | [] => []

fun square x = x*x
val mapResult = map [1, 2, 3, 4, 5] square

fun filter xs predicate =
    case xs of
          x::rest => if predicate x then x :: filter rest predicate else filter rest predicate
          | [] => []

fun filterFun z = z > 2
val filterResult = filter [1, 2, 3, 4, 10] filterFun

fun head xs = case xs of x::rest => x
fun tail xs = case xs of x::rest => rest
val get_head = head [1, 2, 3]
val get_tail = tail [1, 2, 3]

fun list_case list =
    case list of
        [1, 2, 3] => "one two three"
        | [2, 3, 5] => "two three five"
        | _ => "dunno!"
val listCaseResult = list_case [1,2,3]


fun case_within_case value =
    case value of
        x::xs =>
            case x of
                1 => 10
                | 2 => 20
        | _ => 30

val caseWithinCaseResult = case_within_case [1]

fun multiple_cases value =
    case value of
        1 => "one"
        | 2 => "two"
        | 3 => "three"
        | _ => "a number"

val multipleCasesResult = multiple_cases 2