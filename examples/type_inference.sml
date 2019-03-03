(* mapper is a function *)

fun map xs mapper =
    case xs of
        x::rest => mapper x :: map rest mapper
        | [] => []

(*
TODO parse: fn: int list -> int -> string

fun help f = f 5

fun help (f: int -> string): string = f 5

fun map xs mapper =
    case xs of
        x::rest => mapper x :: map rest mapper
        | [] => []

fun length xs =
    case xs of
        [] => 0
        | x::rest => 1 + length rest

val lengthResult = length [1, 2, 3, 4, 5]

fun newly (x:int) = 5 :: x :: []

fun newly x = x :: []
fun boo x = 3 :: x

fun id x = x

TODO:
multiple params, e.g. take list amount = ...sublist... should be inferred 'a list and number -> 'a list


fun head xs = case xs of x::rest => x
val get_head = head [1, 2, 3]

fun tail xs = case xs of x::rest => rest
val get_tail = tail [1, 2, 3]


fun map xs mapper =
    case xs of
        x::rest => mapper x :: map rest mapper
        | [] => []

fun square x = x*x
*)

(*
fun length xs =
    case xs of
        [] => 0
        | x::rest => 1 + length rest

val x = length [[1], [], [], []]

fun get (l: 'a list) = l
val mylist = get [1, 2]

fun add (x: 'a) (l: 'a list) = x :: l

val a = add 5 [1, 2]
val b = add "5" ["1", "2"]

fun id x = x
fun call_another p = id p
val must_be_integer = call_another 10 + call_another 5
val is_string = call_another "hei"
*)