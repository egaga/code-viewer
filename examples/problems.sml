fun boo xs' = xs' (* the generated javascript should not contain variable name with single quote mark *)

fun length (xs:string list) :int =
    case xs of
        [] => 0:int
        | x::rest => (1 + length rest:int) (* the explicit type needs grouping parens, otherwise the whole expression gets the type *)
