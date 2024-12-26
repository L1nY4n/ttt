use nalgebra::{Vector3, DMatrix, DVector};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct BeaconData {
    pub rssi: f64,
    pub position: Vector3<f64>,
}

pub struct LocationCalculator {
    reference_power: f64,
    path_loss_exponent: f64,
}

impl LocationCalculator {
    pub fn new(reference_power: f64, path_loss_exponent: f64) -> Self {
        Self {
            reference_power,
            path_loss_exponent,
        }
    }

    fn rssi_to_distance(&self, rssi: f64) -> f64 {
        10f64.powf((self.reference_power - rssi) / (10.0 * self.path_loss_exponent))
    }

    pub fn calculate_position(&self, beacons: &HashMap<String, BeaconData>) -> Option<Vector3<f64>> {
        if beacons.len() < 4 {  // 至少需要4个点
            return None;
        }

        let beacons: Vec<_> = beacons.values().collect();
        let ref_point = &beacons[0];
        
        // 构建超定方程组 Ax = b
        let n = beacons.len() - 1;
        let mut a = DMatrix::zeros(n, 3);
        let mut b = DVector::zeros(n);

        for (i, beacon) in beacons.iter().skip(1).enumerate() {
            let d1 = self.rssi_to_distance(ref_point.rssi);
            let d2 = self.rssi_to_distance(beacon.rssi);
            
            // 2(x_i - x_1)x + 2(y_i - y_1)y + 2(z_i - z_1)z = d1^2 - d2^2 - r1^2 + ri^2
            let row = 2.0 * (beacon.position - ref_point.position);
            a.row_mut(i).copy_from_slice(&[row.x, row.y, row.z]);
            
            b[i] = d1.powi(2) - d2.powi(2) 
                   - ref_point.position.magnitude_squared() 
                   + beacon.position.magnitude_squared();
        }

        // 使用最小二乘法求解超定方程组
        match a.svd(true, true).solve(&b, 1e-10) {
            Ok(x) => Some(Vector3::new(x[0], x[1], x[2])),
            Err(_) => None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_location_calculation() {
        let mut beacons = HashMap::new();
        
        // 添加测试数据（至少4个点）
        beacons.insert("beacon1".to_string(), BeaconData {
            rssi: -50.0,
            position: Vector3::new(0.0, 0.0, 0.0),
        });
        beacons.insert("beacon2".to_string(), BeaconData {
            rssi: -55.0,
            position: Vector3::new(5.0, 0.0, 0.0),
        });
        beacons.insert("beacon3".to_string(), BeaconData {
            rssi: -60.0,
            position: Vector3::new(0.0, 5.0, 0.0),
        });
        beacons.insert("beacon4".to_string(), BeaconData {
            rssi: -65.0,
            position: Vector3::new(0.0, 0.0, 5.0),
        });
        beacons.insert("beacon5".to_string(), BeaconData {  // 额外的点提高精度
            rssi: -70.0,
            position: Vector3::new(5.0, 5.0, 5.0),
        });

        let calculator = LocationCalculator::new(-40.0, 2.0);
        if let Some(position) = calculator.calculate_position(&beacons) {
            println!("Calculated position: {:?}", position);
            // 验证结果在合理范围内
            assert!(position.x >= -1.0 && position.x <= 6.0);
            assert!(position.y >= -1.0 && position.y <= 6.0);
            assert!(position.z >= -1.0 && position.z <= 6.0);
        } else {
            panic!("Failed to calculate position");
        }
    }
}