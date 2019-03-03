fun filter xs predicate =
    case xs of
          x::rest => if predicate x then x :: filter rest predicate else filter rest predicate
          | [] => []

val filterResult = filter [1, 2, 3, 4, 10] (fn z => z > 2)

(*
fun filter xs predicate =
    case xs of
          x::rest => if predicate x then x :: filter rest predicate else filter rest predicate
          | [] => []

fun filterFun z = z > 2
val filterResult = filter [1, 2, 3, 4, 10] filterFun
*)

(*
fun map xs mapper =
    case xs of
        x::rest => mapper x :: map rest mapper
        | [] => []

val mapResult = map [1, 2, 3, 4, 5] (fn x => x*x)

fun square x = x*x
val mapResult = map [1, 2, 3, 4, 5] square
*)

(*

val lam = fn x => x*2

val anon = fn (x: int) => x*2
val hah = anon 5

*)