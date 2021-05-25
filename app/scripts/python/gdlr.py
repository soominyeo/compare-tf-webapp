
import datetime
import math
import json
import sys
import logging
import os
logging.disable(logging.WARNING)
logging.disable(logging.ERROR)
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import tensorflow as tf
import numpy as np
tf.config.set_visible_devices([], 'GPU')
defaults = {
    "iteration": 500,
    "alpha": 0.001,
    "initialValue": 1,
    "function": 0,
    "N": 100
}


def execute(data):
    try:
        startTime = datetime.datetime.now()

        constants = {**defaults, **data}
        f = parseUserFunction(constants["function"])

        # run Gradient Descent
        opt_X, opt_Y = gradientDescent(
            f, constants['iteration'], constants['alpha'], constants['initialValue'])

        if tf.math.is_nan(opt_X) or tf.math.is_inf(opt_X):
            center = 0
        else:
            center = opt_X.numpy().tolist()

        if data.get('range') and len(data['range']) and data['range'][0] and data['range'][1]:
            constants['range'] = data['range']
        else:
            constants['range'] = [center - 2, center + 2]

        regression, slope, intercept, X, Y = linearRegression(
            f, constants['range'], constants['N'])

        x = X.numpy().tolist()
        graph = Y.numpy().tolist()
        endTime = datetime.datetime.now()

        result = {
            "success": True,
            "graph": {
                "x": x,
                "y": graph
            },
            "optimum": {
                "x": opt_X.numpy().tolist(),
                "y": opt_Y.numpy().tolist()
            },
            "regression": {
                "x": x,
                "y": regression,
                "slope": slope.numpy().tolist(),
                "intercept": intercept.numpy().tolist()
            },
            "rangeX": {
                "min": math.floor(x[0]),
                "max": math.ceil(x[-1])
            },
            "rangeY": {
                "min": math.floor(min(graph + regression)),
                "max": math.ceil(max(graph + regression))
            },
            "time": (endTime - startTime).microseconds // 1000
        }
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }
    finally:
        return result


def parseUserFunction(str):
    coeffs = tuple(reversed(list(
        map(int, (filter(lambda x: x != '', str.split(' ')))))))

    @tf.function
    def userFunction(x):
        result = 0
        for index in range(len(coeffs)):
            result += coeffs[index] * (x ** index)
        return result

    return userFunction


def gradientDescent(f, iteration, alpha, initialValue):
    with tf.GradientTape(persistent=True) as g:
        X = tf.Variable(initialValue, dtype=tf.float32)
        g.watch(X)
        for i in range(iteration):
            X.assign(X - alpha * g.gradient(f(X), X))

    return [X, f(X)]


def linearRegression(f, range, N):
    X = tf.linspace(*range, N)
    Y = f(X)

    slope = (N * tf.reduce_sum(X * Y) - tf.reduce_sum(X) * tf.reduce_sum(Y)
             ) / (N * tf.reduce_sum(X ** 2) - tf.reduce_sum(X) ** 2)
    intercept = tf.reduce_sum(Y) / N - tf.reduce_sum(X) / N * slope
    regression = (slope * X + intercept).numpy().tolist()

    return regression, slope, intercept, X, Y


if __name__ == "__main__":
    data = json.loads(sys.stdin.readline())
    result = execute(data)
    sys.stdout.write(json.dumps(result) + '\n')
    sys.exit(0)
