
extern crate nalgebra as na;
use na::{Vector3, Matrix3};

// 定义信号源结构体，包含二维坐标
struct SignalSource {
    x: f64,
    y: f64,
}

// 模拟从硬件获取RSSI数据的函数，这里只是简单返回预设的模拟值
fn get_rssi_data(num_sources: usize) -> Vec<f64> {
    let mut rssi_data: Vec<f64> = Vec::new();
    for _ in 0..num_sources {
        // 模拟生成一些RSSI值，实际应用需从硬件获取真实值
        rssi_data.push(-40.0 + (rand::random::<f64>() * 20.0));
    }
    rssi_data
}

// 根据RSSI值估算距离的函数，使用简化的距离估算公式（实际可能更复杂）
fn estimate_distance(rssi: f64, rssi_0: f64, path_loss_exponent: f64) -> f64 {
    10.0f64.powf((rssi_0 - rssi) / (10.0 * path_loss_exponent))
}

// 利用nalgebra库进行三边测量定位，通过解方程组计算目标位置
fn trilateration_2d_nalgebra(distances: &[f64], signal_sources: &[SignalSource]) -> (f64, f64) {
    let num_sources = distances.len();
    assert!(num_sources >= 3, "至少需要3个信号源进行三边测量");

    // 构建系数矩阵A
    let mut a_matrix = Matrix3::zeros();
    for i in 0..3 {
        a_matrix[(0, i)] = 2.0 * (signal_sources[i].x - signal_sources[0].x);
        a_matrix[(1, i)] = 2.0 * (signal_sources[i].y - signal_sources[0].y);
        a_matrix[(2, i)] = 1.0;
    }

    // 构建常数项向量b
    let mut b_vector = Vector3::zeros();
    for i in 0..3 {
        b_vector[0] += (signal_sources[i].x.powi(2) - signal_sources[0].x.powi(2))
            + (signal_sources[i].y.powi(2) - signal_sources[0].y.powi(2))
            + (distances[0].powi(2) - distances[i].powi(2));
    }

    // 求解线性方程组 Ax = b
   let lu = a_matrix.lu();
   let solution = lu.solve(&b_vector).unwrap();
   (solution[0], solution[1])
}
#[test]
fn test() {
    // 定义参考RSSI值和路径损耗指数，需要根据实际环境校准
    let rssi_0 = -30.0;
    let path_loss_exponent = 2.0;

    // 假设有3个信号源，定义它们的坐标位置（实际应用中可从配置获取）
    let signal_sources: Vec<SignalSource> = vec![
        SignalSource { x: 0.0, y: 0.0 },
        SignalSource { x: 5.0, y: 0.0 },
        SignalSource { x: 0.0, y: 5.0 },
    ];

    // 获取模拟的RSSI数据，数量与信号源数量一致
    let rssi_data = get_rssi_data(signal_sources.len());

    // 估算目标到每个信号源的距离
    let mut distances: Vec<f64> = Vec::new();
    for rssi in rssi_data.iter() {
        distances.push(estimate_distance(*rssi, rssi_0, path_loss_exponent));
    }

    // 进行三边测量定位，获取目标位置
    let (target_x, target_y) = trilateration_2d_nalgebra(&distances, &signal_sources);
    println!("估计的目标位置: ({}, {})", target_x, target_y);

    // 简单模拟真实位置（这里假设为 (2.0, 2.0) ，实际需准确获取用于对比），计算定位误差
    let real_x = 2.0;
    let real_y = 2.0;
    let error_x = (target_x - real_x).abs();
    let error_y = (target_y - real_y).abs();
    println!("定位误差 (x轴): {}", error_x);
    println!("定位误差 (y轴): {}", error_y);
}